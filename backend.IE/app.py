from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image
import requests
from io import BytesIO
import clip
import torch

app = FastAPI()

device = "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

class Input(BaseModel):
    image_url: str

@app.post("/embed")
def embed(data: Input):
    response = requests.get(data.image_url)
    image = Image.open(BytesIO(response.content)).convert("RGB")

    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        features = model.encode_image(image_input)

    features = features / features.norm(dim=-1, keepdim=True)
    print("Image features:", features.cpu().numpy()[0].tolist())
    return {"vector": features.cpu().numpy()[0].tolist()}