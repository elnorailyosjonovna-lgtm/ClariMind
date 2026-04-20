from app.db.session import engine, Base
from app.models.user import User
from app.models.voice_note import VoiceNote

def init_db():
    Base.metadata.create_all(bind=engine)