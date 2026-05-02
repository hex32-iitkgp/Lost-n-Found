# app/services/embedding.py

from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import clip

# --------- LOAD MODELS ONCE ---------
# (VERY IMPORTANT: do not reload per request)

text_model = SentenceTransformer("all-MiniLM-L6-v2")

device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, preprocess = clip.load("ViT-B/32", device=device)


def get_text_embedding(title: str, description: str, category: str):
    combined_text = f"{title}. {description}. category: {category}"

    embedding = text_model.encode(combined_text, normalize_embeddings=True)

    return embedding.tolist()


# --------- IMAGE EMBEDDING ---------
def get_image_embedding(image_file):
    try:
        image = Image.open(image_file).convert("RGB")
        image_input = preprocess(image).unsqueeze(0).to(device)

        with torch.no_grad():
            image_features = clip_model.encode_image(image_input)

        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        return image_features.cpu().numpy()[0].tolist()

    except Exception as e:
        print("Image embedding failed:", e)
        return None