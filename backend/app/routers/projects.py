from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, dependencies

router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    if current_user.role != models.GlobalRole.admin.value:
        raise HTTPException(status_code=403, detail="Only Global Admins can create projects")
        
    new_project = models.Project(
        name=project.name,
        description=project.description,
        created_by=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Add creator as project admin
    project_member = models.ProjectMember(
        project_id=new_project.id,
        user_id=current_user.id,
        role_in_project=models.ProjectRole.admin.value
    )
    db.add(project_member)
    db.commit()
    db.refresh(new_project)

    return new_project

@router.get("", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Get projects where user is creator OR member
    projects = db.query(models.Project).join(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id
    ).all()
    return projects

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Check membership
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return project

@router.post("/{project_id}/members", response_model=dict)
def add_member(project_id: int, member_data: schemas.ProjectMemberAdd, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Check if current user is project admin
    admin_membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id,
        models.ProjectMember.role_in_project == models.ProjectRole.admin.value
    ).first()
    
    if not admin_membership:
        raise HTTPException(status_code=403, detail="Only project admins can add members")
        
    # Check if user to add exists
    user_to_add = db.query(models.User).filter(models.User.email == member_data.user_email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    existing_membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_to_add.id
    ).first()
    
    if existing_membership:
        raise HTTPException(status_code=400, detail="User already in project")
        
    new_member = models.ProjectMember(
        project_id=project_id,
        user_id=user_to_add.id,
        role_in_project=member_data.role
    )
    db.add(new_member)
    db.commit()
    
    return {"message": "Member added successfully", "user": user_to_add.name}

@router.get("/{project_id}/members", response_model=List[schemas.ProjectMemberResponse])
def get_project_members(project_id: int, db: Session = Depends(dependencies.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Check membership
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
    members = db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).all()
    return members
