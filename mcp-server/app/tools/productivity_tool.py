from typing import Dict, Any
from ..services.task_service import TaskService
from ..services.activity_service import ActivityService

def get_productivity_summary() -> Dict[str, Any]:
    """
    Compute and return live productivity metrics from persistent storage:
    task completion percentage, overdue counts, active tasks, total notes, and recent operations.
    """
    try:
        summary = TaskService.get_summary()
        ActivityService.log_activity(
            activity_type="tool_call",
            status="success",
            details=f"Computed productivity summary: {summary['completion_rate_percent']}% completed across {summary['total_tasks']} tasks.",
            tool_name="get_productivity_summary"
        )
        return {
            "status": "success",
            "summary": summary
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
