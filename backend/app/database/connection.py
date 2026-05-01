from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://aksaha43825_db_user:bfIeQZRPAOczl4Ch@lnfcluster.mwhvxti.mongodb.net/?retryWrites=true&w=majority"

client = AsyncIOMotorClient(MONGO_URL)

database = client["lost_and_found"]

# Collections
users_collection = database["users"]
items_collection = database["items"]
dscc