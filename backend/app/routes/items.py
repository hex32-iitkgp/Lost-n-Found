# app/routes/items.py

from fastapi import APIRouter, Depends, UploadFile, File, Form
from datetime import datetime
from app.utils.dependencies import get_current_user
from app.database.connection import items_collection
from app.services.cloudinary_service import upload_image
router = APIRouter(prefix="/items", tags=["Items"])


@router.get("/")
async def get_items(
    category: str = Query(default="All"),
    type: str = Query(default=None)  # lost / found
):
    query = {}

    if category != "All":
        query["category"] = category

    if type:
        query["type"] = type

    items = []
    async for item in items_collection.find(query):
        item["_id"] = str(item["_id"])
        items.append(item)

    return items

@router.post("/")
async def create_item(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    type: str = Form(...),  # lost / found
    location: str = Form(...),
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    # ☁️ Upload image
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
        "date_reported": datetime.utcnow()
    }

    result = await items_collection.insert_one(new_item)

    return {
        "message": "Item created successfully",
        "item_id": str(result.inserted_id)
    }