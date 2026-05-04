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
import os
import dotenv
from qdrant_client.models import PayloadSchemaType

def create_payload_indexes():
    fields = ["type", "status", "owner_id"]

    for field in fields:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field,
            field_schema=PayloadSchemaType.KEYWORD
        )


dotenv.load_dotenv()
COLLECTION_NAME = "items"
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# --------- CREATE COLLECTION (run once on startup) ---------
def create_collection():
    # print("URL:", QDRANT_URL, "API Key:", os.getenv("QDRANT_API_KEY"))
    existing = [c.name for c in client.get_collections().collections]

    if COLLECTION_NAME in existing:
        return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "text": VectorParams(size=384, distance=Distance.COSINE),
        }
    )

    print("Qdrant collection created")


# --------- UPSERT ITEM ---------
def upsert_item(qid, text_vector, payload):
    vectors = {
        "text": text_vector,
    }

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=qid,
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

    vector_data = point.vector

    if isinstance(vector_data, dict):
        text_vector = vector_data.get("text")
    else:
        text_vector = vector_data

    return text_vector



# def build_filter(target_type, exclude_owner_id):
#     return Filter(
#         must=[
#             FieldCondition(
#                 key="type",
#                 match=MatchValue(value=target_type)
#             ),
#             FieldCondition(
#                 key="status",
#                 match=MatchValue(value="open")
#             )
#         ],
#         must_not=[
#             FieldCondition(
#                 key="owner_id",
#                 match=MatchValue(value=exclude_owner_id)
#             )
#         ]
#     )

# def search_text(query_vector, target_type, exclude_owner_id, limit=10):
#     return client.search(
#         collection_name=COLLECTION_NAME,
#         query_vector=("text", query_vector),
#         limit=limit,
#         query_filter=build_filter(target_type, exclude_owner_id)
#     )


# def search_image(query_vector, target_type, exclude_owner_id, limit=10):
#     return client.search(
#         collection_name=COLLECTION_NAME,
#         query_vector=("image", query_vector),
#         limit=limit,
#         query_filter=build_filter(target_type, exclude_owner_id)
#     )

def delete_item_qdrant(qid):
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector={"ids": [qid]}
    )