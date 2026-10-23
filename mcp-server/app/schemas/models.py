from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TaskBase(BaseModel):
    title: str = Field(..., description="Title of the task")
    description: Optional[str] = Field("", description="Detailed description of the task")
    priority: str = Field("medium", description="Priority level: low, medium, high, urgent")
    due_date: Optional[str] = Field(None, description="Due date in ISO format or YYYY-MM-DD")
    category: str = Field("general", description="Category or tag for grouping")

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    status: str = Field("pending", description="Status: pending, in_progress, completed")
    created_at: str
    completed_at: Optional[str] = None

class NoteBase(BaseModel):
    title: str = Field(..., description="Title of the note")
    content: str = Field(..., description="Markdown or text content of the note")
    category: str = Field("general", description="Category name")
    tags: Optional[str] = Field("", description="Comma-separated tags")

class NoteCreate(NoteBase):
    source: str = Field("user", description="Source: user, assistant, mcp")

class NoteResponse(NoteBase):
    id: str
    source: str
    created_at: str
    updated_at: str

class ActivityLog(BaseModel):
    id: str
    type: str
    tool_name: Optional[str] = None
    status: str
    details: str
    timestamp: str

class ProductivitySummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    completion_rate_percent: float
    total_notes: int
    recent_activity_count: int
