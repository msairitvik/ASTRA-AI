import sys
import logging
from typing import Dict, Any, Optional
from mcp.server.mcpserver import MCPServer
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route

from .config import MCP_HOST, MCP_PORT, MCP_PATH, SERVER_NAME, SERVER_VERSION
from .services.db import init_db, reset_all_data
from .services.activity_service import ActivityService
from .repositories.conversation_repo import ConversationRepository
from .tools.datetime_tool import get_current_datetime as _get_current_datetime
from .tools.calc_tool import calculate as _calculate
from .tools.tasks_tool import (
    create_task as _create_task,
    list_tasks as _list_tasks,
    complete_task as _complete_task,
    delete_task as _delete_task
)
from .tools.notes_tool import (
    create_note as _create_note,
    search_notes as _search_notes,
    list_notes as _list_notes,
    delete_note as _delete_note
)
from .tools.productivity_tool import get_productivity_summary as _get_productivity_summary
from .tools.weather_tool import get_weather as _get_weather
from .tools.units_tool import convert_units as _convert_units
from .tools.search_tool import web_search as _web_search

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("astra.mcp")

# Initialize database
init_db(seed_if_empty=True)

# Create official MCP Server
server = MCPServer(
    name="ASTRA AI Assistant",
    instructions="General-purpose intelligent assistant powered by real MCP tools for time, calculations, task management, notes, productivity analytics, weather, and unit conversions."
)

# 1. get_current_datetime
@server.tool(
    name="get_current_datetime",
    description="Return the current date, time, timezone offset, and readable representation for a specified IANA timezone (defaults to 'UTC')."
)
def get_current_datetime(timezone_str: str = "UTC") -> Dict[str, Any]:
    return _get_current_datetime(timezone_str=timezone_str)

# 2. calculate
@server.tool(
    name="calculate",
    description="Safely evaluate a mathematical expression (arithmetic, exponents, trigonometric functions, square roots, etc.) without arbitrary code execution."
)
def calculate(expression: str) -> Dict[str, Any]:
    return _calculate(expression=expression)

# 3. create_task
@server.tool(
    name="create_task",
    description="Create and persist a new task with a title, optional description, priority ('low', 'medium', 'high', 'urgent'), due date, and category."
)
def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    due_date: str = "",
    category: str = "general"
) -> Dict[str, Any]:
    return _create_task(
        title=title,
        description=description,
        priority=priority,
        due_date=due_date,
        category=category
    )

# 4. list_tasks
@server.tool(
    name="list_tasks",
    description="List stored tasks with optional status ('pending', 'in_progress', 'completed'), priority, or category filters."
)
def list_tasks(
    status: str = "",
    priority: str = "",
    category: str = ""
) -> Dict[str, Any]:
    return _list_tasks(status=status, priority=priority, category=category)

# 5. complete_task
@server.tool(
    name="complete_task",
    description="Mark an existing task as completed in persistent storage using its unique task ID."
)
def complete_task(task_id: str) -> Dict[str, Any]:
    return _complete_task(task_id=task_id)

# 6. delete_task
@server.tool(
    name="delete_task",
    description="Permanently delete a task from persistent storage by its task ID."
)
def delete_task(task_id: str) -> Dict[str, Any]:
    return _delete_task(task_id=task_id)

# 7. create_note
@server.tool(
    name="create_note",
    description="Create and persist a new note with a title, content body, optional category, and tags."
)
def create_note(
    title: str,
    content: str,
    category: str = "general",
    tags: str = "",
    source: str = "mcp"
) -> Dict[str, Any]:
    return _create_note(
        title=title,
        content=content,
        category=category,
        tags=tags,
        source=source
    )

# 8. search_notes
@server.tool(
    name="search_notes",
    description="Search stored notes by text keywords in title, content, or tags, with optional category filtering."
)
def search_notes(query: str, category: str = "") -> Dict[str, Any]:
    return _search_notes(query=query, category=category)

# 9. list_notes
@server.tool(
    name="list_notes",
    description="List all stored notes in persistent storage, optionally filtered by category."
)
def list_notes(category: str = "") -> Dict[str, Any]:
    return _list_notes(category=category)

# 10. delete_note
@server.tool(
    name="delete_note",
    description="Permanently delete a note from persistent storage by its note ID."
)
def delete_note(note_id: str) -> Dict[str, Any]:
    return _delete_note(note_id=note_id)

# 11. get_productivity_summary
@server.tool(
    name="get_productivity_summary",
    description="Compute real-time productivity statistics: completion percentages, task totals, overdue counts, total notes, and recent operations."
)
def get_productivity_summary() -> Dict[str, Any]:
    return _get_productivity_summary()

# 12. get_weather
@server.tool(
    name="get_weather",
    description="Retrieve live current atmospheric weather conditions (temperature, condition, humidity, wind) for any city worldwide using Open-Meteo."
)
def get_weather(city: str) -> Dict[str, Any]:
    return _get_weather(city=city)

# 13. convert_units
@server.tool(
    name="convert_units",
    description="Perform high-precision conversions between length, weight/mass, temperature, and digital storage units."
)
def convert_units(value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
    return _convert_units(value=value, from_unit=from_unit, to_unit=to_unit)

# 14. web_search
@server.tool(
    name="web_search",
    description="Search the live web for recent news, articles, current developments, documentation, and external facts. Returns verified page titles, URLs, and snippets."
)
def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    return _web_search(query=query, max_results=max_results)

# 14. get_activity_logs
@server.tool(
    name="get_activity_logs",
    description="Fetch recent verified activity and tool execution logs from persistent storage."
)
def get_activity_logs(limit: int = 50, filter_type: str = "") -> Dict[str, Any]:
    logs = ActivityService.get_recent_activities(
        limit=limit,
        filter_type=filter_type.strip() if filter_type else None
    )
    return {
        "status": "success",
        "count": len(logs),
        "activities": logs
    }

# 15. reset_demo_data
@server.tool(
    name="reset_demo_data",
    description="Reset database records to the clean initial demo seed data."
)
def reset_demo_data() -> Dict[str, Any]:
    reset_all_data()
    return {
        "status": "success",
        "message": "Demo data successfully reset to initial verified state."
    }

# 16. create_conversation
@server.tool(
    name="create_conversation",
    description="Create a new conversation session in persistent SQLite storage."
)
def create_conversation(title: str = "") -> Dict[str, Any]:
    conv = ConversationRepository.create_conversation(title=title)
    return {"status": "success", "conversation": conv}

# 17. list_conversations
@server.tool(
    name="list_conversations",
    description="List all saved conversation sessions ordered by last updated timestamp."
)
def list_conversations() -> Dict[str, Any]:
    convs = ConversationRepository.list_conversations()
    return {"status": "success", "conversations": convs, "count": len(convs)}

# 18. get_conversation
@server.tool(
    name="get_conversation",
    description="Retrieve a conversation and its full message history by conversation ID."
)
def get_conversation(conversation_id: str) -> Dict[str, Any]:
    conv = ConversationRepository.get_conversation(conversation_id=conversation_id)
    if not conv:
        return {"status": "error", "error": f"Conversation with ID '{conversation_id}' not found."}
    return {"status": "success", "conversation": conv}

# 19. add_message
@server.tool(
    name="add_message",
    description="Add a message to a conversation in persistent storage."
)
def add_message(
    conversation_id: str,
    role: str,
    content: str,
    tool_calls: str = "",
    tool_results: str = ""
) -> Dict[str, Any]:
    tc = None
    tr = None
    if tool_calls:
        try:
            import json
            tc = json.loads(tool_calls)
        except Exception:
            tc = tool_calls
    if tool_results:
        try:
            import json
            tr = json.loads(tool_results)
        except Exception:
            tr = tool_results
    msg = ConversationRepository.add_message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tool_calls=tc,
        tool_results=tr
    )
    return {"status": "success", "message": msg}

# 20. update_conversation_title
@server.tool(
    name="update_conversation_title",
    description="Update the title of a conversation."
)
def update_conversation_title(conversation_id: str, title: str) -> Dict[str, Any]:
    conv = ConversationRepository.update_title(conversation_id=conversation_id, title=title)
    if not conv:
        return {"status": "error", "error": f"Conversation with ID '{conversation_id}' not found."}
    return {"status": "success", "conversation": conv}

# 21. delete_conversation
@server.tool(
    name="delete_conversation",
    description="Delete a conversation and all its messages permanently."
)
def delete_conversation(conversation_id: str) -> Dict[str, Any]:
    success = ConversationRepository.delete_conversation(conversation_id=conversation_id)
    if not success:
        return {"status": "error", "error": f"Conversation with ID '{conversation_id}' not found."}
    return {"status": "success", "message": f"Conversation '{conversation_id}' deleted."}

def main():
    logger.info(f"Starting {SERVER_NAME} v{SERVER_VERSION}")
    logger.info(f"Transport: Streamable HTTP at http://{MCP_HOST}:{MCP_PORT}{MCP_PATH}")
    server.run(
        transport="streamable-http",
        host=MCP_HOST,
        port=MCP_PORT,
        streamable_http_path=MCP_PATH
    )

if __name__ == "__main__":
    main()
