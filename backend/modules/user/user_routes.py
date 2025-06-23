from fastapi import APIRouter


from .services.user_service import UserService

from .schemas import UserCreateSchema, UsersResponseSchema,UserResponseSchema

users_router = APIRouter()
user_service = UserService()

@users_router.get("/{user_id}")
async def get_user_by_id(user_id: str) -> UserResponseSchema:
    return await user_service.get_user_by_id(user_id)



@users_router.get("/")
async def get_all_users() -> UsersResponseSchema:
    return await user_service.get_all_users()