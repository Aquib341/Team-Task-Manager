from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class GlobalRole(str, enum.Enum):
    admin = "admin"
    member = "member"

class ProjectRole(str, enum.Enum):
    admin = "admin"
    member = "member"

class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class TaskPriority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=GlobalRole.member.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_projects = relationship("Project", back_populates="creator", foreign_keys="[Project.created_by]")
    project_memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="[Task.created_by]")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="[Task.assigned_to]")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_projects", foreign_keys=[created_by])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role_in_project = Column(String, default=ProjectRole.member.value)
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=TaskStatus.todo.value)
    priority = Column(String, default=TaskPriority.medium.value)
    due_date = Column(DateTime, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])

    @property
    def assignee_name(self):
        return self.assignee.name if self.assignee else None
