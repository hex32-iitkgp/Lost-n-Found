import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name="dcal8ig2x",
    api_key="237257253679745",
    api_secret="5p79HWfxBcQXHlEXkV0t3QQiV2M"
)

def upload_image(file):  #  make it sync
    result = cloudinary.uploader.upload(file)
    return result["secure_url"]