# app/routes/items.py
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from app.utils.constants.categories import CATEGORIES
from datetime import datetime
from app.utils.dependencies import get_current_user
from app.database.connection import items_collection, users_collection
from app.services.cloudinary_service import upload_image, delete_cloudinary_image
from bson import ObjectId
import os
import dotenv
from app.services.qdrant_service import upsert_item, delete_item_qdrant  # we’ll create this next
import requests

dotenv.load_dotenv()
TEXT_EMBED_URL = os.getenv("TEXT_EMBED_URL")
# IMAGE_EMBED_URL = os.getenv("IMAGE_EMBED_URL")
SEARCH_SERVICE_URL = os.getenv("SEARCH_SERVICE_URL")

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
    qid = uuid.uuid4()
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
        "qid": str(qid),
        "user_name": user["name"],
        "claims": []
    }

    # image_vector = None
    if image:
        image_url = upload_image(image.file)
        item["image_url"] = image_url

        # try:
        #     image_vector = requests.post(
        #         IMAGE_EMBED_URL,
        #         json={"image_url": image_url}
        #     ).json().get("vector")
        # except Exception as e:
        #     print("Image embedding error:", e)
        #     image_vector = None

    # --------- SAVE TO MONGO ---------
    

    # --------- TEXT EMBEDDING ---------
    text_input = f"{title}. {description}. {category}"

    result = await items_collection.insert_one(item)
    item_id = str(result.inserted_id)

    async def store_in_qdrant(qid, item_id, text_vector, type, category, user):
        try:
            upsert_item(   # ❗ removed await since upsert_item is not async
                qid=qid,
                text_vector=text_vector,
                # image_vector=image_vector,
                payload={
                    "mongo_id": item_id,
                    "type": type,
                    "status": "open",
                    "category": category,
                    "owner_id": str(user["_id"]),
                }
            )
        except Exception as e:
            print("Qdrant upsert error:", e)
            raise HTTPException(status_code=500, detail="Failed to store item vector")

    try:
        text_vector = requests.post(
            TEXT_EMBED_URL,
            json={"text": text_input}
        ).json()["vector"]
        await store_in_qdrant(qid, item_id, text_vector, item["type"], item["category"], user)
    except Exception as e:
        print("Error saving item vector to Qdrant:", e)
        if item_id:
            await items_collection.delete_one({"_id": ObjectId(item_id)})
            delete_item_qdrant(str(qid))  # Rollback Qdrant entry if exists
            print("Rollback delete result")
            raise HTTPException(status_code=500, detail="Failed to create item")

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

    if item.get("qid"):
        try:
            delete_item_qdrant(item["qid"])  # Delete from Qdrant using qid
        except Exception as e:
            print("Error deleting from Qdrant:", e)

    if item.get("image_url"):
        delete_cloudinary_image(item["image_url"])

    await items_collection.delete_one({"_id": ObjectId(item_id)})
    await users_collection.update_many(
        {"claimed.item_id": item_id},
        {"$pull": {"claimed": {"item_id": item_id}}}
    )

    return {"message": "Item deleted successfully"}

@router.post("/claim")
async def claim_item(
    item_id: str = Form(...),
    user_name: str = Form(...),
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
        "user_name": user_name,
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

    item = await items_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        return {"items": []}

    # --------- CALL SEARCH SERVICE ---------
    try:
        res = requests.post(
            SEARCH_SERVICE_URL,
            json={
                "qid": item.get("qid"),
                "type": item.get("type"),
                "exclude_owner_id": str(user["_id"]),
                "limit": 10
            }
        ).json()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Search service error")

    results = res.get("results", [])

    if not results:
        return {"items": []}

    # --------- FETCH ITEMS ---------
    object_ids = [ObjectId(r["mongo_id"]) for r in results]

    cursor = items_collection.find({"_id": {"$in": object_ids}})

    items = []
    async for it in cursor:
        it["_id"] = str(it["_id"])
        it["probability"] = next(
            (r["score"] for r in results if r["mongo_id"] == it["_id"]),
            0
        )
        items.append(it)

    return {"items": items}

# @router.get("/{item_id}/claims")
# async def get_claims(
#     item_id: str,
#     user=Depends(get_current_user)
# ):
#     item = await items_collection.find_one({"_id": ObjectId(item_id)})

#     if not item:
#         raise HTTPException(status_code=404, detail="Item not found")

#     # Only owner can see claims
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