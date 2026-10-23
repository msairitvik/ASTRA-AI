from typing import Dict, Any, Optional
from ..services.task_service import TaskService

def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    due_date: str = "",
    category: str = "general"
) -> Dict[str, Any]:
    """
    Create and persist a new task in ASTRA AI.

    Args:
        title: Short title or summary of the task
        description: Optional detailed description
        priority: Priority level: 'low', 'medium', 'high', or 'urgent'
        due_date: Optional due date in ISO or YYYY-MM-DD format
        category: Optional category or project tag (e.g. 'work', 'personal', 'hackathon')
    """
    try:
        clean_due = due_date.strip() if due_date and due_date.strip() else None
        task = TaskService.create_task(
            title=title,
            description=description,
            priority=priority,
            due_date=clean_due,
            category=category
        )
        return {
            "status": "success",
            "message": f"Task '{task['title']}' created successfully.",
            "task": task
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def list_tasks(
    status: str = "",
    priority: str = "",
    category: str = ""
) -> Dict[str, Any]:
    """
    List stored tasks with optional filters.

    Args:
        status: Filter by status ('pending', 'in_progress', 'completed')
        priority: Filter by priority ('low', 'medium', 'high', 'urgent')
        category: Filter by category
    """
    try:
        tasks = TaskService.list_tasks(
            status=status.strip() if status else None,
            priority=priority.strip() if priority else None,
            category=category.strip() if category else None
        )
        return {
            "status": "success",
            "count": len(tasks),
            "filters": {
                "status": status or None,
                "priority": priority or None,
                "category": category or None
            },
            "tasks": tasks
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def complete_task(task_id: str) -> Dict[str, Any]:
    """
    Mark an existing task as completed by its ID.

    Args:
        task_id: Unique UUID identifier of the task to complete
    """
    try:
        task = TaskService.complete_task(task_id.strip())
        return {
            "status": "success",
            "message": f"Task '{task['title']}' marked as completed.",
            "task": task
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def delete_task(task_id: str) -> Dict[str, Any]:
    """
    Permanently delete a task by its ID.

    Args:
        task_id: Unique UUID identifier of the task to delete
    """
    try:
        success = TaskService.delete_task(task_id.strip())
        if success:
            return {
                "status": "success",
                "message": f"Task '{task_id}' was deleted."
            }
        return {
            "status": "error",
            "error": f"Task with ID '{task_id}' not found."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
