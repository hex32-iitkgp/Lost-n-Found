from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(redirect_slashes=False)
model = SentenceTransformer("all-MiniLM-L6-v2")

class Input(BaseModel):
    text: str

@app.post("/embed")
def embed(data: Input):
    vec = model.encode(data.text).tolist()
    print("Text features:", vec)
    return {"vector": vec}