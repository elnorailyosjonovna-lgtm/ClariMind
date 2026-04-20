from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.voice_note import VoiceNote
from app.schemas.voice_note import VoiceNoteCreate, VoiceNoteResponse
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/notes", response_model=VoiceNoteResponse)
def create_note(
    note: VoiceNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_note = VoiceNote(
        transcript=note.transcript,
        structured_data=note.structured_data,
        user_id=current_user.id,
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


@router.get("/notes", response_model=list[VoiceNoteResponse])
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = db.query(VoiceNote).filter(VoiceNote.user_id == current_user.id).all()
    return notes