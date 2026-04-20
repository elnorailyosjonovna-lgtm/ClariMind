from pydantic import BaseModel
from datetime import datetime


class VoiceNoteCreate(BaseModel):
    transcript: str
    structured_data: str | None = None


class VoiceNoteResponse(BaseModel):
    id: int
    transcript: str
    structured_data: str | None
    created_at: datetime

    model_config = {"from_attributes": True}