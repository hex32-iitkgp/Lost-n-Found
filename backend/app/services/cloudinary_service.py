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


def delete_cloudinary_image(image_url: str):
    try:
        parts = image_url.split("/")
        public_id_with_ext = "/".join(parts[-2:])
        public_id = public_id_with_ext.split(".")[0]

        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print("Cloudinary delete error:", e)