# app/services/qdrant_service.py

from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
import requests
from io import BytesIO
from PIL import Image
import torch
import os

# --------- CONFIG ---------
QDRANT_URL = os.getenv("QDRANT_URL")
COLLECTION_NAME = "items"

client = QdrantClient(
    url=QDRANT_URL,
    api_key=os.getenv("QDRANT_API_KEY"),
)

# --------- CREATE COLLECTION (run once on startup) ---------
def create_collection():
    existing = [c.name for c in client.get_collections().collections]

    if COLLECTION_NAME in existing:
        return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "text": VectorParams(size=384, distance=Distance.COSINE),
            "image": VectorParams(size=512, distance=Distance.COSINE),
        }
    )

    print("Qdrant collection created ✔")


# --------- UPSERT ITEM ---------
def upsert_item(item_id, text_vector, image_vector, payload):
    vectors = {
        "text": text_vector,
    }

    # image optional
    if image_vector:
        vectors["image"] = image_vector

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=item_id,
                vector=vectors,
                payload=payload
            )
        ]
    )

def get_item_vectors(item_id: str):
    result = client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[item_id],
        with_vectors=True,
        with_payload=False,
    )

    if not result:
        return None, None

    point = result[0]

    text_vector = point.vector.get("text")
    image_vector = point.vector.get("image")

    return text_vector, image_vector



def build_filter(target_type, exclude_owner_id):
    return Filter(
        must=[
            FieldCondition(
                key="type",
                match=MatchValue(value=target_type)
            ),
            FieldCondition(
                key="status",
                match=MatchValue(value="open")
            )
        ],
        must_not=[
            FieldCondition(
                key="owner_id",
                match=MatchValue(value=exclude_owner_id)
            )
        ]
    )

def search_text(query_vector, target_type, exclude_owner_id, limit=10):
    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=("text", query_vector),
        limit=limit,
        query_filter=build_filter(target_type, exclude_owner_id)
    )


def search_image(query_vector, target_type, exclude_owner_id, limit=10):
    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=("image", query_vector),
        limit=limit,
        query_filter=build_filter(target_type, exclude_owner_id)
    )