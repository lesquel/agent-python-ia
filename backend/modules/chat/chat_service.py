from core.database import db
from fastapi import HTTPException
from typing import Union
from .models.chat_model import (ChatSystemModel, ChatUserModel, ChatSystemModelInDB, ChatUserModelInDB)
from .chat_adapter import chat_system_in_chat_system_in_db, chat_user_in_chat_user_in_db
collection = db["chat"]

class ChatService:
    def __init__(self):
        pass

    async def create_chat(self, chat: Union[ChatSystemModel, ChatUserModel]) -> Union[ChatSystemModelInDB, ChatUserModelInDB]:
        result = await collection.insert_one(chat.dict())
        new_chat = await collection.find_one({"_id": result.inserted_id})
        return chat_system_in_chat_system_in_db(new_chat)

    async def get_chat(self, chat_id: str) -> Union[ChatSystemModelInDB, ChatUserModelInDB]:
        chat = await collection.find_one({"_id": chat_id})
        print(chat)
        if chat is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat_system_in_chat_system_in_db(chat)

    async def get_all_chats(self) -> list[Union[ChatSystemModelInDB, ChatUserModelInDB]]:
        chats = await collection.find().to_list(length=100)
        return [chat_system_in_chat_system_in_db(chat) for chat in chats]