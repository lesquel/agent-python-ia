from typing import Tuple
from fastapi import Depends, HTTPException, status
import jwt
from datetime import timedelta
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jwt.exceptions import InvalidTokenError


from .token_service import TokenService

from modules.user.schemas import UserCreateSchema, UserResponseSchema, UserInDB
from db import db

from core.config import settings
from ..schemas import TokenData, Token, LoginResponseSchema

collection = db["users"]


CRENDENTIAL_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


class AuthService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
    token_service = TokenService()

    def __init__(self):
        pass

    def verify_password(self, plain_password, hashed_password):
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password):
        return self.pwd_context.hash(password)

    async def get_current_user(self, token: str = Depends(oauth2_scheme)):
        try:
            payload = self.token_service.decode_token(token)
            email: str = payload.get("sub")
            if email is None:
                raise CRENDENTIAL_EXCEPTION
            token_data = TokenData(email=email)
        except InvalidTokenError:
            raise CRENDENTIAL_EXCEPTION
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
            )

        user = await collection.find_one({"email": email})
        if user is None:
            raise CRENDENTIAL_EXCEPTION
        return user

    async def register_user(self, user: UserCreateSchema) -> UserResponseSchema:
        found_user = await collection.find_one({"email": user.email})
        if found_user is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )
        hashed_password = self.get_password_hash(user.password)
        user_data = user.model_dump(exclude={"password"})
        user_data["hashed_password"] = hashed_password
        result = await collection.insert_one(user_data)
        new_user = await collection.find_one({"_id": result.inserted_id})
        return UserResponseSchema(**new_user)

    async def authenticate_user(self, email: str, password: str):
        user = await collection.find_one({"email": email})
        if not user:
            return False
        if not self.verify_password(password, user["hashed_password"]):
            return False
        return user

    async def login_user(self, user: UserCreateSchema) -> LoginResponseSchema:
        user = await self.authenticate_user(user.email, user.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        access_expiration = timedelta(minutes=settings.jwt.jwt_expiration_minutes)
        access_token = self.token_service.create_access_token(
            data={"sub": user["email"]}, expires_delta=access_expiration
        )

        token_obj = Token(access_token=access_token, token_type="bearer")

        return LoginResponseSchema(
            access_token=token_obj, user=UserResponseSchema(**user)
        )
