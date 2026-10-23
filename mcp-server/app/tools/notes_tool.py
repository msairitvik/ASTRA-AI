from typing import Dict, Any, Optional
from ..services.note_service import NoteService

def create_note(
    title: str,
    content: str,
    category: str = "general",
    tags: str = "",
    source: str = "mcp"
) -> Dict[str, Any]:
    """
    Create and persist a new note or knowledge entry.

    Args:
        title: Title of the note
        content: Detailed body text or Markdown content
        category: Category or topic (e.g. 'ideas', 'meeting', 'project', 'architecture')
        tags: Comma-separated list of tags
        source: Creation source ('user', 'assistant', 'mcp')
    """
    try:
        note = NoteService.create_note(
            title=title,
            content=content,
            category=category,
            tags=tags,
            source=source
        )
        return {
            "status": "success",
            "message": f"Note '{note['title']}' saved successfully.",
            "note": note
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def search_notes(
    query: str,
    category: str = ""
) -> Dict[str, Any]:
    """
    Search stored notes matching keywords in title, content, or tags.

    Args:
        query: Search term or keywords to look for
        category: Optional category filter
    """
    try:
        notes = NoteService.search_notes(
            query=query,
            category=category.strip() if category else None
        )
        return {
            "status": "success",
            "query": query,
            "count": len(notes),
            "notes": notes
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def list_notes(category: str = "") -> Dict[str, Any]:
    """
    List all stored notes, optionally filtered by category.

    Args:
        category: Optional category filter
    """
    try:
        notes = NoteService.list_notes(category=category.strip() if category else None)
        return {
            "status": "success",
            "count": len(notes),
            "notes": notes
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def delete_note(note_id: str) -> Dict[str, Any]:
    """
    Delete a note by its ID.

    Args:
        note_id: Unique UUID identifier of the note to delete
    """
    try:
        success = NoteService.delete_note(note_id.strip())
        if success:
            return {
                "status": "success",
                "message": f"Note '{note_id}' was deleted."
            }
        return {
            "status": "error",
            "error": f"Note with ID '{note_id}' not found."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
