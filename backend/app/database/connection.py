from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_URL)

database = client["lost_and_found"]

# Collections
users_collection = database["users"]
items_collection = database["items"]
