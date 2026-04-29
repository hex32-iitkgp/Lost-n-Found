# app/routes/items.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from app.utils.constants import CATEGORIES
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
    type: str = Form(...),
    location: str = Form(...),
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    # 🔥 PUT IT RIGHT HERE (before DB insert)
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")

    image_url = await upload_image(image.file)

    new_item = {
        "title": title,
        "description": description,
        "category": category,
        "type": type,
        "location": location,
        "image_url": image_url,
        "reported_by": str(user["_id"]),
        "status": "open",
        "date_reported": datetime.utcnow(),
        "claims": []
    }

    result = await items_collection.insert_one(new_item)

    return {
        "message": "Item created successfully",
        "item_id": str(result.inserted_id)
    }


from fastapi import Query

@router.get("/my")
async def get_my_items(
    type: str = Query(default=None),  # lost / found
    category: str = Query(default=None),
    user=Depends(get_current_user)
):
    query = {
        "reported_by": str(user["_id"])
    }

    if type:
        query["type"] = type

    if category and category != "All":
        query["category"] = category

    items = []
    async for item in items_collection.find(query):
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
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 🔐 OWNERSHIP CHECK
    if item["reported_by"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {
        "title": title,
        "description": description,
        "category": category,
        "type": type,
        "location": location,
    }

    # ☁️ If new image provided → upload
    if image:
        image_url = await upload_image(image.file)
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

    # 🔐 OWNERSHIP CHECK
    if item["reported_by"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await items_collection.delete_one({"_id": ObjectId(item_id)})

    return {"message": "Item deleted successfully"}

from fastapi import Query
from bson import ObjectId

from fastapi import Query

@router.get("/")
async def get_items(
    category: str = Query(default="All"),
    type: str = Query(default=None),
    search: str = Query(default=None)
):
    query = {}

    if category != "All":
        query["category"] = category

    if type:
        query["type"] = type

    # 🔎 Search support
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    items = []

    cursor = items_collection.find(query).sort("date_reported", -1)

    async for item in cursor:
        item["_id"] = str(item["_id"])
        items.append(item)

    return items

@router.post("/{item_id}/claim")
async def claim_item(
    item_id: str,
    message: str = Form(...),
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # ❌ Prevent claiming your own item
    if item["reported_by"] == str(user["_id"]):
        raise HTTPException(status_code=400, detail="You cannot claim your own item")

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

@router.get("/{item_id}/claims")
async def get_claims(
    item_id: str,
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 🔐 Only owner can see claims
    if item["reported_by"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    return item.get("claims", [])


@router.put("/{item_id}/claim/{claim_user_id}")
async def respond_to_claim(
    item_id: str,
    claim_user_id: str,
    action: str = Form(...),  # accept / reject
    user=Depends(get_current_user)
):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 🔐 Only owner can respond
    if item["reported_by"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    claims = item.get("claims", [])

    for claim in claims:
        if claim["user_id"] == claim_user_id:
            if action == "accept":
                claim["status"] = "accepted"

                # 🎯 Mark item as resolved
                item["status"] = "resolved"
            else:
                claim["status"] = "rejected"

    await items_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"claims": claims, "status": item["status"]}}
    )

    return {"message": f"Claim {action}ed"}