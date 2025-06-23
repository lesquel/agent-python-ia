from fastapi import APIRouter


from .services.auth_service import AuthService


from modules.user.schemas import UserCreateSchema, UserResponseSchema
from .schemas import LoginResponseSchema

auth_router = APIRouter()
auth_service = AuthService()


@auth_router.post("/register")
async def register_user(user: UserCreateSchema) -> UserResponseSchema:
    return await auth_service.register_user(user)


@auth_router.post("/login")
async def login_user(user: UserCreateSchema) -> LoginResponseSchema:
    return await auth_service.login_user(user)


@auth_router.get("/me")
async def current_user(token: str) -> UserResponseSchema:
    return await auth_service.get_current_user(token)


