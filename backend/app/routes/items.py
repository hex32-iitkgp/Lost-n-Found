# app/routes/items.py

from fastapi import APIRouter, Query
from app.database.connection import items_collection

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