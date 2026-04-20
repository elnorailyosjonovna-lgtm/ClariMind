from fastapi import APIRouter, HTTPException
from app.db.session import test_db_connection

router = APIRouter()

@router.get("/db-test")
def db_test():
    try:
        result = test_db_connection()
        return {"database": "connected", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")