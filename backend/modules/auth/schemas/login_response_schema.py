from pydantic import BaseModel
from modules.user.schemas import UserResponseSchema
from .token_schema import Token

class LoginResponseSchema(BaseModel):
    access_token: Token
    user: UserResponseSchema