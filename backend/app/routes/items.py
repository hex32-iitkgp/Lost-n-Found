# app/routes/items.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from app.utils.constants.categories import CATEGORIES
from datetime import datetime
from app.utils.dependencies import get_current_user
from app.database.connection import items_collection
from app.services.cloudinary_service import upload_image
from bson import ObjectId


router = APIRouter(prefix="/items", tags=["Items"])


@router.post("/")
async def create_item(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    image: UploadFile = File(None),
    user=Depends(get_current_user)
):
    #  Upload to Cloudinary
    
    item = {
        "title": title,
        "description": description,
        "category": (category if category in CATEGORIES else "Other"),
        "location": location,
        "type": type,
        "owner_id": str(user["_id"]),
        "email": user["email"],
        "date_reported": datetime.utcnow(),
        "status": "open",  # open / resolved
        "claims": []  # to store claim requests
    }
    if (image.file) : 
        image_url = upload_image(image.file)
        item["image_url"] = image_url
    
    result = await items_collection.insert_one(item)

    return {
        "message": "Item created successfully",
        "item_id": str(result.inserted_id)
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


    claim = {
        "user_id": str(user["_id"]),
        "message": message,
        "status": "pending"
    }

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$push": {"claims": claim}}
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