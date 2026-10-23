import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from ..config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db(seed_if_empty: bool = True):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        due_date TEXT,
        category TEXT DEFAULT 'general',
        created_at TEXT NOT NULL,
        completed_at TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '',
        source TEXT DEFAULT 'user',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tool_name TEXT,
        status TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT,
        tool_results TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    """)

    conn.commit()

    if seed_if_empty:
        cursor.execute("SELECT COUNT(*) as count FROM tasks")
        task_count = cursor.fetchone()["count"]
        if task_count == 0:
            seed_demo_data(conn)

    conn.close()

def seed_demo_data(conn: sqlite3.Connection = None):
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    sample_tasks = [
        (
            str(uuid.uuid4()),
            "Finalize quarterly project roadmap",
            "Consolidate team deliverables, timeline milestones, and review with leadership",
            "high",
            "completed",
            "2026-10-24T18:00:00Z",
            "work",
            now_iso,
            now_iso
        ),
        (
            str(uuid.uuid4()),
            "Review monthly budget and expenses",
            "Reconcile utility statements, cloud subscriptions, and planned savings",
            "high",
            "in_progress",
            "2026-10-25T12:00:00Z",
            "finance",
            now_iso,
            None
        ),
        (
            str(uuid.uuid4()),
            "Schedule annual dental checkup",
            "Book preventive appointment and update insurance records",
            "medium",
            "pending",
            "2026-10-26T20:00:00Z",
            "personal",
            now_iso,
            None
        ),
        (
            str(uuid.uuid4()),
            "Prepare weekend grocery and meal plan",
            "List fresh ingredients for Saturday dinner and weekly meal prep",
            "low",
            "pending",
            "2026-10-27T15:00:00Z",
            "home",
            now_iso,
            None
        )
    ]

    cursor.executemany("""
    INSERT INTO tasks (id, title, description, priority, status, due_date, category, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_tasks)

    sample_notes = [
        (
            str(uuid.uuid4()),
            "ASTRA AI Everyday Assistant Guide",
            "# ASTRA AI Assistant Guide\n\n- **Conversational Queries**: Ask everyday questions, brainstorming prompts, and general knowledge.\n- **Time & Timezones**: 'What time is it in India?', 'Time in Tokyo'.\n- **Weather & Conditions**: Live forecasts for any city worldwide.\n- **Productivity & Notes**: Manage personal tasks and knowledge bases seamlessly.",
            "guide",
            "assistant,guide,help",
            "assistant",
            now_iso,
            now_iso
        ),
        (
            str(uuid.uuid4()),
            "Reading List & Creative Ideas",
            "1. Focus & Deep Work techniques.\n2. Modern architecture patterns for personal assistants.\n3. Daily meditation and morning routines.",
            "ideas",
            "reading,ideas,personal",
            "user",
            now_iso,
            now_iso
        )
    ]

    cursor.executemany("""
    INSERT INTO notes (id, title, content, category, tags, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_notes)

    sample_activities = [
        (
            str(uuid.uuid4()),
            "system",
            None,
            "success",
            "Database initialized with standard schema and verified SQLite WAL configuration.",
            now_iso
        ),
        (
            str(uuid.uuid4()),
            "tool_call",
            "complete_task",
            "success",
            "Task 'Verify Streamable HTTP transport compliance' marked as completed.",
            now_iso
        )
    ]

    cursor.executemany("""
    INSERT INTO activity_logs (id, type, tool_name, status, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
    """, sample_activities)

    conn.commit()
    if should_close:
        conn.close()

def reset_all_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages;")
    cursor.execute("DELETE FROM conversations;")
    cursor.execute("DELETE FROM activity_logs;")
    cursor.execute("DELETE FROM notes;")
    cursor.execute("DELETE FROM tasks;")
    conn.commit()
    seed_demo_data(conn)
    conn.close()
