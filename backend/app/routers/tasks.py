from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, dependencies

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Check if user is an admin in the project
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not member or member.role_in_project != models.ProjectRole.admin.value:
        raise HTTPException(status_code=403, detail="Only Project Admins can create tasks")
        
    # Get assigned user ID
    assigned_user = db.query(models.User).filter(models.User.email == task.assigned_to_email).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")
        
    # Ensure assigned user is part of the project
    assigned_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == assigned_user.id
    ).first()
    if not assigned_member:
        raise HTTPException(status_code=400, detail="Assigned user is not a member of this project")

    new_task = models.Task(
        title=task.title,
        description=task.description,
        status=task.status.value,
        priority=task.priority.value,
        due_date=task.due_date,
        project_id=task.project_id,
        assigned_to=assigned_user.id,
        created_by=current_user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Manually attach assigned_user to the model for response since it's lazy loaded
    new_task.assigned_user = assigned_user
    return new_task

@router.get("", response_model=List[schemas.TaskResponse])
def get_tasks(
    status: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(dependencies.get_db), 
    current_user: models.User = Depends(dependencies.get_current_user)
):
    # Base query: Only tasks from projects the user is a member of
    query = db.query(models.Task).join(
        models.ProjectMember, 
        models.Task.project_id == models.ProjectMember.project_id
    ).filter(models.ProjectMember.user_id == current_user.id)

    # Filter by user's role in each project:
    # If the user is a 'member' in a project, they can only see tasks assigned to them in that project.
    # If they are 'admin', they see all tasks in that project.
    # We apply this logically:
    query = query.filter(
        (models.ProjectMember.role_in_project == models.ProjectRole.admin.value) | 
        (models.Task.assigned_to == current_user.id)
    )

    if status:
        query = query.filter(models.Task.status == status)
    if assigned_to:
        query = query.filter(models.Task.assigned_to == assigned_to)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)

    tasks = query.all()
    return tasks

@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this project")
        
    # Member can only update their own tasks. Admins can update any task.
    if member.role_in_project != models.ProjectRole.admin.value and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit tasks assigned to you")
        
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.status is not None:
        task.status = task_update.status.value
    if task_update.priority is not None:
        task.priority = task_update.priority.value
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not member or member.role_in_project != models.ProjectRole.admin.value:
        raise HTTPException(status_code=403, detail="Only Project Admins can delete tasks")
        
    db.delete(task)
    db.commit()
