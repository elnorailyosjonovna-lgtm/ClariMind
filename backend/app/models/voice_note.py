from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class VoiceNote(Base):
    __tablename__ = "voice_notes"

    id = Column(Integer, primary_key=True, index=True)
    transcript = Column(Text, nullable=False)
    structured_data = Column(Text, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())