import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import List

from app.models import Base, Workspace, Project, Task, TaskStatus
from app.schemas import WorkspaceCreate, WorkspaceResponse, ProjectCreate, ProjectResponse, TaskCreate, TaskUpdate, TaskResponse

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sprintpulse.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SprintPulse SaaS API", openapi_url="/api/v1/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok", "service": "SprintPulse SaaS API"}

# Workspaces
@app.post("/api/v1/workspaces", response_model=WorkspaceResponse)
def create_workspace(ws: WorkspaceCreate, db: Session = Depends(get_db)):
    workspace = Workspace(name=ws.name, slug=ws.slug)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace

@app.get("/api/v1/workspaces", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    return db.query(Workspace).all()

# Projects
@app.post("/api/v1/projects", response_model=ProjectResponse)
def create_project(proj: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(name=proj.name,
                      client_name=proj.client_name,
                      description=proj.description,
                      workspace_id=proj.workspace_id
                      )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@app.get("/api/v1/projects", response_model=List[ProjectResponse])
def list_projects(workspace_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    return query.all()

# Tasks
@app.post("/api/v1/tasks", response_model=TaskResponse)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task = Task(title=task_in.title, description=task_in.description, status=task_in.status,priority=task_in.priority, project_id=task_in.project_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.get("/api/v1/tasks", response_model=List[TaskResponse])
def list_tasks(project_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Task)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    return query.all()

@app.patch("/api/v1/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_up: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_up.title is not None:
        task.title = task_up.title

    if task_up.description is not None:
        task.description = task_up.description

    if task_up.status is not None:
        task.status = task_up.status

    if task_up.priority is not None:
        task.priority = task_up.priority

    db.commit()
    db.refresh(task)
    return task
