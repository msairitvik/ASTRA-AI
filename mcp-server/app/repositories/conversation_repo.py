import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from ..services.db import get_db_connection

class ConversationRepository:
    @staticmethod
    def create_conversation(title: str = "") -> Dict[str, Any]:
        conv_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        clean_title = title.strip() if title and title.strip() else "New Conversation"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO conversations (id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        """, (conv_id, clean_title, now_iso, now_iso))
        conn.commit()
        conn.close()

        return {
            "id": conv_id,
            "title": clean_title,
            "created_at": now_iso,
            "updated_at": now_iso,
            "messages": []
        }

    @staticmethod
    def list_conversations() -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
        conv = cursor.fetchone()
        if not conv:
            conn.close()
            return None

        cursor.execute("""
            SELECT * FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp ASC
        """, (conversation_id,))
        msg_rows = cursor.fetchall()
        conn.close()

        messages = []
        for r in msg_rows:
            m = dict(r)
            if m.get("tool_calls"):
                try:
                    m["tool_calls"] = json.loads(m["tool_calls"])
                except Exception:
                    pass
            if m.get("tool_results"):
                try:
                    m["tool_results"] = json.loads(m["tool_results"])
                except Exception:
                    pass
            messages.append(m)

        res = dict(conv)
        res["messages"] = messages
        return res

    @staticmethod
    def add_message(
        conversation_id: str,
        role: str,
        content: str,
        tool_calls: Optional[Any] = None,
        tool_results: Optional[Any] = None
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        tc_str = json.dumps(tool_calls) if tool_calls else None
        tr_str = json.dumps(tool_results) if tool_results else None

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if conversation exists; if not, create it
        cursor.execute("SELECT id, title FROM conversations WHERE id = ?", (conversation_id,))
        conv = cursor.fetchone()
        if not conv:
            title = content[:35] + "..." if len(content) > 35 else content
            cursor.execute("""
                INSERT INTO conversations (id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            """, (conversation_id, title, now_iso, now_iso))
        else:
            # If conversation was named "New Conversation" and this is first user message, update title
            if role == "user" and conv["title"] == "New Conversation":
                title = content[:35] + "..." if len(content) > 35 else content
                cursor.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conversation_id))

            cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso, conversation_id))

        cursor.execute("""
            INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_results, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, conversation_id, role, content, tc_str, tr_str, now_iso))

        conn.commit()
        conn.close()

        return {
            "id": msg_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "tool_calls": tool_calls,
            "tool_results": tool_results,
            "timestamp": now_iso
        }

    @staticmethod
    def update_title(conversation_id: str, title: str) -> Optional[Dict[str, Any]]:
        clean_title = title.strip()
        if not clean_title:
            return None

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?", (
            clean_title,
            datetime.now(timezone.utc).isoformat(),
            conversation_id
        ))
        conn.commit()

        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
        conv = cursor.fetchone()
        conn.close()
        return dict(conv) if conv else None

    @staticmethod
    def delete_conversation(conversation_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        changes = conn.total_changes
        conn.commit()
        conn.close()
        return changes > 0
