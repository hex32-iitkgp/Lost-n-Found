from pydantic import BaseModel
from typing import Optional

class ItemCreate(BaseModel):
    title: str
    description: str
    category: str
    type: str  # "lost" or "found"
    location: str