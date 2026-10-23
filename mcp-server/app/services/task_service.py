from typing import Optional, List, Dict, Any
from ..repositories.task_repo import TaskRepository
from ..repositories.activity_repo import ActivityRepository

class TaskService:
    @staticmethod
    def create_task(
        title: str,
        description: str = "",
        priority: str = "medium",
        due_date: Optional[str] = None,
        category: str = "general"
    ) -> Dict[str, Any]:
        if not title or not title.strip():
            raise ValueError("Task title cannot be empty")

        task = TaskRepository.create(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            category=category
        )
        ActivityRepository.log(
            activity_type="tool_call",
            status="success",
            details=f"Created task '{task['title']}' with priority '{task['priority']}'.",
            tool_name="create_task"
        )
        return task

    @staticmethod
    def list_tasks(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return TaskRepository.list_all(status=status, priority=priority, category=category)

    @staticmethod
    def complete_task(task_id: str) -> Dict[str, Any]:
        if not task_id:
            raise ValueError("Task ID is required")
        task = TaskRepository.complete(task_id)
        if not task:
            raise ValueError(f"Task with ID '{task_id}' not found")
        ActivityRepository.log(
            activity_type="tool_call",
            status="success",
            details=f"Completed task '{task['title']}' (ID: {task_id}).",
            tool_name="complete_task"
        )
        return task

    @staticmethod
    def delete_task(task_id: str) -> bool:
        if not task_id:
            raise ValueError("Task ID is required")
        existing = TaskRepository.get_by_id(task_id)
        success = TaskRepository.delete(task_id)
        if success and existing:
            ActivityRepository.log(
                activity_type="tool_call",
                status="success",
                details=f"Deleted task '{existing['title']}' (ID: {task_id}).",
                tool_name="delete_task"
            )
        return success

    @staticmethod
    def get_summary() -> Dict[str, Any]:
        return TaskRepository.get_summary()
