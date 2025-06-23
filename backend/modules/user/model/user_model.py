from bson import ObjectId
from pydantic import BaseModel, Field

from db.utils import PyObjectId


class UserModel(BaseModel):
    id: PyObjectId = Field(alias="_id")
    email: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        validate_by_field_name = True
