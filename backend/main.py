import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from agno_agents.agent_app import agent_app

from core.config import settings

from modules.user import users_router
from modules.auth import auth_router

app = FastAPI()
app.mount("/agents", agent_app)


app.include_router(users_router, prefix="/users", tags=["user"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
