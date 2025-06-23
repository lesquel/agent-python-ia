import jwt
from datetime import datetime, timedelta, timezone


from core.config import settings


class TokenService:
    def __init__(self):
        pass

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, settings.jwt.jwt_secret_key, algorithm=settings.jwt.jwt_algorithm
        )
        return encoded_jwt

    def decode_token(self, token: str) -> dict:
        return jwt.decode(
            token, settings.jwt.jwt_secret_key, algorithms=[settings.jwt.jwt_algorithm]
        )
