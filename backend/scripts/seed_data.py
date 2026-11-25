
import os
import sys

# Allow Python to find the app package when running this script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, Workspace, Project, Task, TaskStatus

# Use the same database URL as main.py
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sprintpulse.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def seed_data():
    db = SessionLocal()

    try:
        # Create or reuse workspace
        workspace = db.query(Workspace).filter_by(slug="sprintpulse-demo").first()

        if not workspace:
            workspace = Workspace(
                name="SprintPulse Demo",
                slug="sprintpulse-demo"
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

        # Create or reuse project
        project = db.query(Project).filter_by(
            name="Website Development",
            workspace_id=workspace.id
        ).first()

        if not project:
            project = Project(
                name="Website Development",
                client_name="Acme Technologies",
                description="Tasks for developing the company website",
                workspace_id=workspace.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)

        # Sample tasks with realistic priorities
        sample_tasks = [
            {
                "title": "Fix critical login authentication bug",
                "description": "Users are unable to log in due to an authentication issue.",
                "status": TaskStatus.TODO,
                "priority": "HIGH"
            },
            {
                "title": "Complete payment gateway integration",
                "description": "Integrate and test the payment gateway.",
                "status": TaskStatus.IN_PROGRESS,
                "priority": "HIGH"
            },
            {
                "title": "Improve dashboard UI",
                "description": "Make the dashboard layout cleaner and responsive.",
                "status": TaskStatus.TODO,
                "priority": "MEDIUM"
            },
            {
                "title": "Write API documentation",
                "description": "Document the existing API endpoints.",
                "status": TaskStatus.IN_PROGRESS,
                "priority": "MEDIUM"
            },
            {
                "title": "Update footer styling",
                "description": "Adjust spacing and colors in the website footer.",
                "status": TaskStatus.TODO,
                "priority": "LOW"
            },
            {
                "title": "Clean up unused CSS",
                "description": "Remove old and unused CSS classes.",
                "status": TaskStatus.DONE,
                "priority": "LOW"
            }
        ]

        for task_data in sample_tasks:
            existing_task = db.query(Task).filter_by(
                title=task_data["title"],
                project_id=project.id
            ).first()

            if not existing_task:
                task = Task(
                    title=task_data["title"],
                    description=task_data["description"],
                    status=task_data["status"],
                    priority=task_data["priority"],
                    project_id=project.id
                )
                db.add(task)

        db.commit()
        print("Seed data inserted successfully!")
        print(f"Workspace: {workspace.name}")
        print(f"Project: {project.name}")
        print("Sample tasks include HIGH, MEDIUM, and LOW priorities.")

    except Exception as error:
        db.rollback()
        print(f"Error seeding data: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
