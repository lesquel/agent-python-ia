from fastapi import APIRouter, HTTPException
from .chat_service import ChatService
from .schemas.chat_model import ChatSystemModel, ChatUserModel

chat_router = APIRouter()

chat_service = ChatService()

@chat_router.post("/")
async def create_chat(chat: ChatSystemModel | ChatUserModel):
    return await chat_service.create_chat(chat)

@chat_router.get("/{chat_id}")
async def get_chat(chat_id: str):
    return await chat_service.get_chat(chat_id)

@chat_router.get("/")
async def get_all_chats():
    return await chat_service.get_all_chats()

