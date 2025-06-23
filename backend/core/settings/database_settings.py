from pydantic_settings import BaseSettings

import os

enviroment = os.environ.get("ENVIRONMENT", "dev")


class DatabaseSettings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongo_db_name: str

    class Config:
        env_file = f"core/envs/.db.{enviroment}.env"
