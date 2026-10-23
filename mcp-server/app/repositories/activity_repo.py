import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from ..services.db import get_db_connection

class ActivityRepository:
    @staticmethod
    def log(
        activity_type: str,
        status: str,
        details: str,
        tool_name: Optional[str] = None
    ) -> Dict[str, Any]:
        log_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO activity_logs (id, type, tool_name, status, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (log_id, activity_type, tool_name, status, details, now_iso))
        conn.commit()
        conn.close()

        return {
            "id": log_id,
            "type": activity_type,
            "tool_name": tool_name,
            "status": status,
            "details": details,
            "timestamp": now_iso
        }

    @staticmethod
    def list_recent(limit: int = 50, filter_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        if filter_type:
            cursor.execute("""
                SELECT * FROM activity_logs
                WHERE type = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (filter_type, limit))
        else:
            cursor.execute("""
                SELECT * FROM activity_logs
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def clear() -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM activity_logs")
        conn.commit()
        conn.close()
        return True
