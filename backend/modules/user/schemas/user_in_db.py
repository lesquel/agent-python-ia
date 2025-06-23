from ..model import UserModel

class UserInDB(UserModel):
    hashed_password: str