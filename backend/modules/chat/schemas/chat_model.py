from pydantic import BaseModel, Field
from typing import Optional

class ChatSystemModel(BaseModel):
    label: str
    timestamp: str
    displayContent: str
    type: str


class ChatUserModel(BaseModel):
    label: str
    timestamp: str
    displayContent: str
    type: str


class ChatSystemModelInDB(ChatSystemModel):
    id: Optional[str] = Field(default=None, alias="_id")

class ChatUserModelInDB(ChatUserModel):
    id: Optional[str] = Field(default=None, alias="_id")