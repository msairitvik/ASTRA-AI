from typing import Optional, List, Dict, Any
from ..repositories.note_repo import NoteRepository
from ..repositories.activity_repo import ActivityRepository

class NoteService:
    @staticmethod
    def create_note(
        title: str,
        content: str,
        category: str = "general",
        tags: str = "",
        source: str = "user"
    ) -> Dict[str, Any]:
        if not title or not title.strip():
            raise ValueError("Note title cannot be empty")
        if not content or not content.strip():
            raise ValueError("Note content cannot be empty")

        note = NoteRepository.create(
            title=title,
            content=content,
            category=category,
            tags=tags,
            source=source
        )
        ActivityRepository.log(
            activity_type="tool_call",
            status="success",
            details=f"Created note '{note['title']}' under category '{note['category']}'.",
            tool_name="create_note"
        )
        return note

    @staticmethod
    def list_notes(category: Optional[str] = None) -> List[Dict[str, Any]]:
        return NoteRepository.list_all(category=category)

    @staticmethod
    def search_notes(query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return NoteRepository.list_all(category=category)
        return NoteRepository.search(query=query, category=category)

    @staticmethod
    def get_by_id(note_id: str) -> Optional[Dict[str, Any]]:
        return NoteRepository.get_by_id(note_id)

    @staticmethod
    def delete_note(note_id: str) -> bool:
        if not note_id:
            raise ValueError("Note ID is required")
        existing = NoteRepository.get_by_id(note_id)
        success = NoteRepository.delete(note_id)
        if success and existing:
            ActivityRepository.log(
                activity_type="tool_call",
                status="success",
                details=f"Deleted note '{existing['title']}' (ID: {note_id}).",
                tool_name="delete_note"
            )
        return success
