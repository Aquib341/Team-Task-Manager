from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from .models import GlobalRole, ProjectRole, TaskStatus, TaskPriority

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: GlobalRole
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class ProjectMemberBase(BaseModel):
    user_id: int
    role_in_project: ProjectRole
    joined_at: datetime

class ProjectMemberResponse(BaseModel):
    id: int
    project_id: int
    user: UserResponse
    role_in_project: ProjectRole
    joined_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    members: List[ProjectMemberResponse] = []

    class Config:
        from_attributes = True

class ProjectMemberAdd(BaseModel):
    user_email: EmailStr
    role: ProjectRole

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    assigned_to_email: EmailStr
    project_id: int
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime
    project_id: int
    assigned_to: Optional[int] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    assignee_name: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
