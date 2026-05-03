import cloudinary
import cloudinary.uploader
import os
import dotenv

dotenv.load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image(file):  #  make it sync
    result = cloudinary.uploader.upload(file)
    return result["secure_url"]