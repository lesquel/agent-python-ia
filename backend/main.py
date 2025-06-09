from typing import Union
from modules.chat.chat_controller import chat_router
from fastapi import FastAPI

app = FastAPI()


# app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(chat_router)