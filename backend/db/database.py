from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings

client = AsyncIOMotorClient(settings.database.mongodb_uri)
db = client[settings.database.mongo_db_name]
