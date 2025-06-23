from bson import ObjectId
from fastapi import HTTPException, status


def convert_id_to_Objectid(id):
    try:
        return ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")
