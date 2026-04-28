# app/routes/auth.py

from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.database.connection import users_collection

router = APIRouter(prefix="/auth", tags=["Auth"])
@router.post("/register")
async def register(user: UserCreate):
    existing = await users_collection.find_one({"email": user.email})
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = hash_password(user.password)

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "profile_pic": None
    }

    result = await users_collection.insert_one(new_user)

    return {"message": "User created successfully"}

@router.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "user_id": str(db_user["_id"])
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }