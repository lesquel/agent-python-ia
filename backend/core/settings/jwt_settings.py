from pydantic_settings import BaseSettings


class JWTSettings(BaseSettings):
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    class Config:
        env_file = "core/envs/.jwt.env"



