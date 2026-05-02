# app/routes/items.py

from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from app.utils.constants.categories import CATEGORIES
from datetime import datetime
from app.utils.dependencies import get_current_user
from app.database.connection import items_collection, users_collection
from app.services.cloudinary_service import upload_image
from bson import ObjectId
from app.services.embedding import get_text_embedding, get_image_embedding
from app.services.qdrant_service import upsert_item  # we’ll create this next
from app.services.qdrant_service import search_text, search_image
import requests
from io import BytesIO
from PIL import Image
import torch
from app.services.qdrant_service import get_item_vectors

router = APIRouter(prefix="/items", tags=["Items"])

def get_opposite_type(t: str):
    return "found" if t == "lost" else "lost"

@router.post("/")
async def create_item(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    image: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    item = {
        "title": title,
        "description": description,
        "category": (category if category in CATEGORIES else "Other"),
        "location": location,
        "type": type,
        "owner_id": str(user["_id"]),
        "email": user["email"],
        "date_reported": datetime.utcnow(),
        "status": "open",
        "claims": []
    }

    image_vector = None

    # --------- IMAGE UPLOAD + EMBEDDING ---------
    if image:
        image_url = upload_image(image.file)
        item["image_url"] = image_url

        try:
            image.file.seek(0)  # important
            image_vector = get_image_embedding(image.file)
        except Exception as e:
            print("Image embedding error:", e)
            image_vector = None

    # --------- SAVE TO MONGO ---------
    result = await items_collection.insert_one(item)
    item_id = str(result.inserted_id)

    # --------- TEXT EMBEDDING ---------
    text_vector = get_text_embedding(title, description, category)

    # --------- STORE IN QDRANT ---------
    upsert_item(   # ❗ removed await
        item_id=item_id,
        text_vector=text_vector,
        image_vector=image_vector,
        payload={
            "mongo_id": item_id,
            "type": type,
            "status": "open",
            "category": category,
            "owner_id": str(user["_id"]),   # ✅ REQUIRED
        }
    )

    return {
        "message": "Item created successfully",
        "item_id": item_id
    }


@router.get("/")
async def get_items(
    type: str = Query(default=None),
    category: str = Query(default="All"),
    search: str = Query(default=None),
    location: str = Query(default=None),
    limit: int = 20,
    skip: int = Query(default=0)
):
    query = {"status": "open"}

    if type:
        query["type"] = type

    if category != "All":
        query["category"] = category

    #  Step 1: Description search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    #  Step 2: Location filter (applies on above result)
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    cursor = items_collection.find(query)\
        .sort("date_reported", -1)\
        .skip(skip)\
        .limit(limit)

    items = []
    async for item in cursor:
        item["_id"] = str(item["_id"])
        items.append(item)

    return items


from fastapi import Query

@router.get("/my")
async def get_my_items(
    category: str = Query(default=None),
    search: str = Query(default=None),
    location: str = Query(default=None),
    limit: int = 20,
    skip: int = Query(default=0),
    user=Depends(get_current_user)
):
    query = {
        "owner_id": str(user["_id"])
    }

    if category and category != "All":
        query["category"] = category

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    # 📍 Step 2: Location filter (applies on above result)
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    cursor = items_collection.find(query)\
        .sort("date_reported", -1)\
        .skip(skip)\
        .limit(limit)

    items = []
    async for item in cursor:
        item["_id"] = str(item["_id"])
        items.append(item)

    return items

@router.put("/{item_id}")
async def update_item(
    item_id: str,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    type: str = Form(...),
    location: str = Form(...),
    image: UploadFile = File(None),
    status: str = Form(...),
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # OWNERSHIP CHECK
    if item["owner_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {
        "title": title,
        "description": description,
        "category": category,
        "type": type,
        "location": location,
        "status": status,
    }

    # If new image provided → upload
    if image:
        image_url = upload_image(image.file)
        update_data["image_url"] = image_url

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )

    return {"message": "Item updated successfully"}

@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # OWNERSHIP CHECK
    if item["owner_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await items_collection.delete_one({"_id": ObjectId(item_id)})

    return {"message": "Item deleted successfully"}

from fastapi import Query
from bson import ObjectId

from fastapi import Query



@router.post("/claim")
async def claim_item(
    item_id: str = Form(...),
    message: str = Form(...),
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # ❌ Prevent claiming your own item
    if item["owner_id"] == str(user["_id"]):
        raise HTTPException(status_code=400, detail="You cannot claim your own item")

    already_claimed = any(
        c["user_id"] == str(user["_id"]) for c in item.get("claims", [])
    )

    if already_claimed:
        raise HTTPException(status_code=400, detail="Already claimed")

    update_user_claims = {
        "item_id": item_id,
    }

    claim = {
        "user_id": str(user["_id"]),
        "message": message,
        "status": "pending"
    }

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$push": {"claims": claim}}
    )

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$push": {"claimed": update_user_claims}}
    )

    return {"message": "Claim request sent"}

@router.post("/{item_id}/claims/{user_email}/approve")
async def approve_claim(item_id: str, user_email: str, user=Depends(get_current_user)):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # only owner can approve
    if item["owner_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not allowed")

    updated = False

    for claim in item.get("claims", []):
        if claim["message"] == user_email:
            claim["status"] = "approved"
            updated = True
        else:
            claim["status"] = "rejected"

    if not updated:
        raise HTTPException(status_code=404, detail="Claim not found")

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$set": {
                "claims": item["claims"],
                "status": "resolved"
            }
        }
    )

    return {"message": "Claim approved"}

@router.post("/{item_id}/claims/{user_email}/reject")
async def reject_claim(item_id: str, user_email: str, user=Depends(get_current_user)):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item["owner_id"] != str(user["_id"]):
        raise HTTPException(status_code=403)

    for claim in item.get("claims", []):
        if claim["message"] == user_email:
            claim["status"] = "rejected"

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"claims": item["claims"]}}
    )

    return {"message": "Claim rejected"}

@router.post("/{item_id}/claimsremove")
async def remove_claim(item_id: str, user=Depends(get_current_user)):
    print("Removing claim for item_id:", item_id, "user:", user["email"])
    item = await items_collection.find_one({"_id": ObjectId(item_id)})
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # for claim in item.get("claims", []):
    #     if claim["message"] == user["email"]:
    #         item["claims"].remove(claim)
    #         break

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$pull": {"claims": {"message": user["email"] }}}
    )

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$pull": {"claimed": {"item_id": item_id }}}
    )

    return {"message": "Claim removed"}

@router.get("/show_claimed")
async def show_claimed(user=Depends(get_current_user)):
    item = await users_collection.find_one({"name": user["name"]})
    return {"claims": item.get("claimed", [])}

print("Defining get_many_items endpoint...")

@router.get("/many")
async def get_many_items(
    item_id: str = Query(default=None, alias="item_id"),
    user=Depends(get_current_user)):

    print("Received item_id:", item_id)
    if not item_id:
        return {"items": []}

    object_ids = ObjectId(item_id)

    item = await items_collection.find_one({"_id": object_ids})

    if not item:
        return {"items": []}

    item["_id"] = str(item["_id"])
    return item

@router.get("/{item_id}/recommendation")
async def get_ai_recommendation(item_id: str, user=Depends(get_current_user)):
    # --------- 1. Fetch selected item ---------
    item = await items_collection.find_one({"_id": ObjectId(item_id)})
    exclude_owner_id = str(user["_id"])
    if not item:
        return {"items": []}
    
    text_vector, image_vector = get_item_vectors(item_id)

    if text_vector is None:
        return {"items": []}

    # if text_vector is None:
    #     print("Vector missing, fallback to embedding")
    #     text_vector = get_text_embedding(...)

    target_type = get_opposite_type(item.get("type"))

    # --------- 3. Qdrant searches ---------
    text_results = search_text(text_vector, target_type, exclude_owner_id, limit=10)

    image_results = []
    if image_vector is not None:
        image_results = search_image(image_vector, target_type, exclude_owner_id, limit=10)
    
    scores = {}  # mongo_id -> score

    # text scores (weight 0.6)
    for r in text_results:
        mongo_id = r.payload.get("mongo_id")
        if not mongo_id:
            continue
        scores[mongo_id] = scores.get(mongo_id, 0) + (0.6 * r.score)

    # image scores (weight 0.4)
    for r in image_results:
        mongo_id = r.payload.get("mongo_id")
        if not mongo_id:
            continue
        scores[mongo_id] = scores.get(mongo_id, 0) + (0.4 * r.score)

    # --------- 5. Rank ---------
    sorted_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_ids = [mid for mid, _ in sorted_ids[:10]]

    if not top_ids:
        return {"items": []}

    # --------- 6. Fetch full items ---------
    object_ids = [ObjectId(mid) for mid in top_ids]

    cursor = items_collection.find({"_id": {"$in": object_ids}})

    items = []
    async for it in cursor:
        it["_id"] = str(it["_id"])
        items.append(it)

    # --------- 7. Preserve ranking order ---------
    id_to_item = {it["_id"]: it for it in items}
    ordered_items = [id_to_item[mid] for mid in top_ids if mid in id_to_item]

    return {"items": ordered_items}


# @router.get("/{item_id}/claims")
# async def get_claims(
#     item_id: str,
#     user=Depends(get_current_user)
# ):
#     item = await items_collection.find_one({"_id": ObjectId(item_id)})

#     if not item:
#         raise HTTPException(status_code=404, detail="Item not found")

#     # 🔐 Only owner can see claims
#     if item["reported_by"] != str(user["_id"]):
#         raise HTTPException(status_code=403, detail="Not authorized")

#     return item.get("claims", [])


# @router.put("/{item_id}/claim/{claim_user_id}")
# async def respond_to_claim(
#     item_id: str,
#     claim_user_id: str,
#     action: str = Form(...),  # accept / reject
#     user=Depends(get_current_user)
# ):
#     item = await items_collection.find_one({"_id": ObjectId(item_id)})

#     if not item:
#         raise HTTPException(status_code=404, detail="Item not found")

#     # 🔐 Only owner can respond
#     if item["reported_by"] != str(user["_id"]):
#         raise HTTPException(status_code=403, detail="Not authorized")

#     claims = item.get("claims", [])

#     for claim in claims:
#         if claim["user_id"] == claim_user_id:
#             if action == "accept":
#                 claim["status"] = "accepted"

#                 # 🎯 Mark item as resolved
#                 item["status"] = "resolved"
#             else:
#                 claim["status"] = "rejected"

#     await items_collection.update_one(
#         {"_id": ObjectId(item_id)},
#         {"$set": {"claims": claims, "status": item["status"]}}
#     )

#     return {"message": f"Claim {action}ed"}