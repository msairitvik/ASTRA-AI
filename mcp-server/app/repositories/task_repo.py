import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from ..services.db import get_db_connection

class TaskRepository:
    @staticmethod
    def create(
        title: str,
        description: str = "",
        priority: str = "medium",
        due_date: Optional[str] = None,
        category: str = "general"
    ) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        priority = priority.lower() if priority in ["low", "medium", "high", "urgent"] else "medium"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (id, title, description, priority, status, due_date, category, created_at, completed_at)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, NULL)
        """, (task_id, title.strip(), description.strip(), priority, due_date, category.strip().lower(), created_at))
        conn.commit()
        conn.close()

        return {
            "id": task_id,
            "title": title.strip(),
            "description": description.strip(),
            "priority": priority,
            "status": "pending",
            "due_date": due_date,
            "category": category.strip().lower(),
            "created_at": created_at,
            "completed_at": None
        }

    @staticmethod
    def get_by_id(task_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def list_all(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM tasks WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status.lower())
        if priority:
            query += " AND priority = ?"
            params.append(priority.lower())
        if category:
            query += " AND category = ?"
            params.append(category.lower())

        query += " ORDER BY CASE WHEN status = 'pending' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END, created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def complete(task_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        completed_at = datetime.now(timezone.utc).isoformat()
        cursor.execute("UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?", (completed_at, task_id))
        conn.commit()

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        updated = cursor.fetchone()
        conn.close()
        return dict(updated) if updated else None

    @staticmethod
    def update(
        task_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        due_date: Optional[str] = None,
        category: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            return None

        updates = []
        params = []
        if title is not None:
            updates.append("title = ?")
            params.append(title.strip())
        if description is not None:
            updates.append("description = ?")
            params.append(description.strip())
        if priority is not None:
            updates.append("priority = ?")
            params.append(priority.lower())
        if status is not None:
            updates.append("status = ?")
            params.append(status.lower())
            if status.lower() == "completed" and not existing["completed_at"]:
                updates.append("completed_at = ?")
                params.append(datetime.now(timezone.utc).isoformat())
            elif status.lower() != "completed":
                updates.append("completed_at = NULL")
        if due_date is not None:
            updates.append("due_date = ?")
            params.append(due_date)
        if category is not None:
            updates.append("category = ?")
            params.append(category.strip().lower())

        if updates:
            params.append(task_id)
            cursor.execute(f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        updated = cursor.fetchone()
        conn.close()
        return dict(updated) if updated else None

    @staticmethod
    def delete(task_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        changes = conn.total_changes
        conn.commit()
        conn.close()
        return changes > 0

    @staticmethod
    def get_summary() -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as count FROM tasks")
        total = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'")
        completed = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'")
        pending = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'")
        in_progress = cursor.fetchone()["count"]

        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute("SELECT COUNT(*) as count FROM tasks WHERE status != 'completed' AND due_date IS NOT NULL AND due_date < ?", (now_iso,))
        overdue = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM notes")
        total_notes = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM activity_logs")
        activity_count = cursor.fetchone()["count"]

        conn.close()

        rate = round((completed / total * 100), 1) if total > 0 else 0.0

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "overdue_tasks": overdue,
            "completion_rate_percent": rate,
            "total_notes": total_notes,
            "recent_activity_count": activity_count
        }
