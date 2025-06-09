from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str
    mongo_db_name: str

    class Config:
        env_file = ".env"

settings = Settings()