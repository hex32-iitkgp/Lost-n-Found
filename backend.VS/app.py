from fastapi import FastAPI
from pydantic import BaseModel
from qdrant_service import get_item_vectors, search_text


app = FastAPI()

class SearchInput(BaseModel):
    qid: str
    type: str
    exclude_owner_id: str
    limit: int = 10


def get_opposite_type(t: str):
    return "found" if t == "lost" else "lost"


@app.post("/search")
def search(data: SearchInput):

    text_vector = get_item_vectors(data.qid)

    if text_vector is None:
        return {"results": []}

    target_type = get_opposite_type(data.type)

    text_results = search_text(
        text_vector,
        target_type,
        data.exclude_owner_id,
        data.limit
    )

    # image_results = []
    # if image_vector:
    #     image_results = search_image(
    #         image_vector,
    #         target_type,
    #         data.exclude_owner_id,
    #         data.limit
    #     )

    scores = {}

    for r in text_results.points:
        mid = r.payload.get("mongo_id")
        if mid:
            scores[mid] = scores.get(mid, 0) + (0.6 * r.score)

    # for r in image_results.points:
    #     mid = r.payload.get("mongo_id")
    #     if mid:
    #         scores[mid] = scores.get(mid, 0) + (0.4 * r.score)

    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    return {
        "results": [
            {"mongo_id": mid, "score": score}
            for mid, score in sorted_items[:data.limit]
        ]
    }