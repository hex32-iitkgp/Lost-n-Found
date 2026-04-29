from fastapi import APIRouter, Depends
from fastapi import Form, HTTPException
from app.utils.security import hash_password, verify_password
from fastapi import UploadFile, File
from app.database.connection import users_collection
from app.utils.dependencies import get_current_user
from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    user["_id"] = str(user["_id"])
    user.pop("password", None)  # never send password

    return user


@router.put("/update")
async def update_profile(
    name: str = Form(None),
    place: str = Form(None),
    old_password: str = Form(None),
    new_password: str = Form(None),
    user=Depends(get_current_user)
):
    update_data = {}

    if name:
        update_data["name"] = name

    if place:
        update_data["place"] = place

    # 🔐 Handle password change
    if old_password and new_password:
        if not verify_password(old_password, user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect old password")

        update_data["password"] = hash_password(new_password)

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided")

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )

    return {"message": "Profile updated successfully"}


@router.post("/upload-profile-pic")
async def upload_profile_pic(
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    image_url = await upload_image(image.file)

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"profile_pic": image_url}}
    )

    return {
        "message": "Profile picture updated",
        "profile_pic": image_url
    }