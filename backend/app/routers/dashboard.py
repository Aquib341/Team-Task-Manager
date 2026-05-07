from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
from .. import models, schemas, dependencies

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Count tasks assigned to current user only
    base_query = db.query(models.Task).filter(models.Task.assigned_to == current_user.id)
    
    total_tasks = base_query.count()
    pending_tasks = base_query.filter(models.Task.status == models.TaskStatus.todo.value).count()
    in_progress_tasks = base_query.filter(models.Task.status == models.TaskStatus.in_progress.value).count()
    completed_tasks = base_query.filter(models.Task.status == models.TaskStatus.done.value).count()
    
    # Overdue = due_date < now AND status != done
    now = datetime.utcnow()
    overdue_tasks = base_query.filter(
        models.Task.due_date < now,
        models.Task.status != models.TaskStatus.done.value
    ).count()
    
    return schemas.DashboardStats(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks
    )

@router.get("/recent-tasks", response_model=List[schemas.TaskResponse])
def get_recent_tasks(db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Array of 10 most recent/upcoming tasks assigned to user
    tasks = db.query(models.Task).filter(
        models.Task.assigned_to == current_user.id
    ).order_by(models.Task.due_date.asc()).limit(10).all()
    
    response_tasks = []
    for t in tasks:
        tr = schemas.TaskResponse.model_validate(t)
        if t.assignee:
            tr.assignee_name = t.assignee.name
        response_tasks.append(tr)
        
    return response_tasks
