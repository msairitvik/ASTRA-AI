import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from ..services.db import get_db_connection

class NoteRepository:
    @staticmethod
    def create(
        title: str,
        content: str,
        category: str = "general",
        tags: str = "",
        source: str = "user"
    ) -> Dict[str, Any]:
        note_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notes (id, title, content, category, tags, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (note_id, title.strip(), content.strip(), category.strip().lower(), tags.strip(), source.strip(), now_iso, now_iso))
        conn.commit()
        conn.close()

        return {
            "id": note_id,
            "title": title.strip(),
            "content": content.strip(),
            "category": category.strip().lower(),
            "tags": tags.strip(),
            "source": source.strip(),
            "created_at": now_iso,
            "updated_at": now_iso
        }

    @staticmethod
    def get_by_id(note_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def list_all(category: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT * FROM notes WHERE category = ? ORDER BY updated_at DESC", (category.lower(),))
        else:
            cursor.execute("SELECT * FROM notes ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def search(query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        pattern = f"%{query.strip().lower()}%"

        if category:
            cursor.execute("""
                SELECT * FROM notes
                WHERE category = ? AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?)
                ORDER BY updated_at DESC
            """, (category.lower(), pattern, pattern, pattern))
        else:
            cursor.execute("""
                SELECT * FROM notes
                WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?
                ORDER BY updated_at DESC
            """, (pattern, pattern, pattern))

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def update(
        note_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            return None

        updates = []
        params = []
        if title is not None:
            updates.append("title = ?")
            params.append(title.strip())
        if content is not None:
            updates.append("content = ?")
            params.append(content.strip())
        if category is not None:
            updates.append("category = ?")
            params.append(category.strip().lower())
        if tags is not None:
            updates.append("tags = ?")
            params.append(tags.strip())

        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())

        params.append(note_id)
        cursor.execute(f"UPDATE notes SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        updated = cursor.fetchone()
        conn.close()
        return dict(updated) if updated else None

    @staticmethod
    def delete(note_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        changes = conn.total_changes
        conn.commit()
        conn.close()
        return changes > 0
