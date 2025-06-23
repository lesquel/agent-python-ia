

from pydantic import BaseModel
from ..model import UserModel



class UserBaseSchema(BaseModel):
    email: str
    
    
class UserCreateSchema(UserBaseSchema):
    password: str
    
    
class UserResponseSchema(UserModel):
    pass
    
    
class UsersResponseSchema(BaseModel):
    users : list[UserResponseSchema]
    
    
class LoginUserSchema(UserBaseSchema):
    access_token: str