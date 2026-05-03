from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.qdrant_service import create_collection, create_payload_indexes
import dotenv

dotenv.load_dotenv()
create_collection()
create_payload_indexes()
app = FastAPI(redirect_slashes=False)


# CORS (must be here)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Routes
from app.routes import items, users,auth
print("Including routers...")
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(users.router)