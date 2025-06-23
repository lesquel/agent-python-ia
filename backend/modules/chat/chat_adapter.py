from .schemas.chat_model import ChatSystemModel, ChatUserModel, ChatSystemModelInDB, ChatUserModelInDB

def chat_system_in_chat_system_in_db(chat_system: dict) -> ChatSystemModelInDB:
    chat_system["_id"] = str(chat_system["_id"])  # convertir ObjectId a str
    return ChatSystemModelInDB(**chat_system)

def chat_user_in_chat_user_in_db(chat_user: dict) -> ChatUserModelInDB:
    chat_user["_id"] = str(chat_user["_id"])
    return ChatUserModelInDB(**chat_user)
