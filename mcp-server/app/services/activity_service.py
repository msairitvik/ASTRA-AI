from typing import Optional, List, Dict, Any
from ..repositories.activity_repo import ActivityRepository

class ActivityService:
    @staticmethod
    def log_activity(
        activity_type: str,
        status: str,
        details: str,
        tool_name: Optional[str] = None
    ) -> Dict[str, Any]:
        return ActivityRepository.log(
            activity_type=activity_type,
            status=status,
            details=details,
            tool_name=tool_name
        )

    @staticmethod
    def get_recent_activities(limit: int = 50, filter_type: Optional[str] = None) -> List[Dict[str, Any]]:
        return ActivityRepository.list_recent(limit=limit, filter_type=filter_type)

    @staticmethod
    def clear_activities() -> bool:
        return ActivityRepository.clear()
