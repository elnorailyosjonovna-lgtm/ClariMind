from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.voice_note import VoiceNote
from app.schemas.voice_note import VoiceNoteCreate, VoiceNoteUpdate, VoiceNoteResponse
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


@router.put("/notes/{note_id}", response_model=VoiceNoteResponse)
def update_note(
    note_id: int,
    note_update: VoiceNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(VoiceNote).filter(VoiceNote.id == note_id, VoiceNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    note.structured_data = note_update.structured_data
    db.commit()
    db.refresh(note)
    
    return note


@router.get("/notes", response_model=list[VoiceNoteResponse])
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = db.query(VoiceNote).filter(VoiceNote.user_id == current_user.id).all()
    return notes


@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(VoiceNote).filter(VoiceNote.id == note_id, VoiceNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}