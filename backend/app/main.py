from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, projects, tasks, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Task Manager API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Team Task Manager API"}
