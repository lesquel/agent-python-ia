from fastapi import HTTPException, status


from db import db
from db.utils import convert_id_to_Objectid

from ..schemas import UserResponseSchema, UsersResponseSchema


collection = db["users"]


class UserService:
    def __init__(self):
        pass

    async def get_user_by_id(self, user_id: str) -> UserResponseSchema:
        user_id = convert_id_to_Objectid(user_id)
        user = await collection.find_one({"_id": user_id})
        print(user)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return UserResponseSchema(**user)

    async def get_all_users(
        self,
    ) -> UsersResponseSchema:
        users = await collection.find().to_list(length=100)

        return UsersResponseSchema(users=[UserResponseSchema(**user) for user in users])
