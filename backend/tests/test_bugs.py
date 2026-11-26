
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session as SQLAlchemySession

from app.main import app
from app.models import Task, TaskStatus

client = TestClient(app)


def test_disappearing_task_bug():

    response = client.patch(
        "/api/v1/tasks/808fada8-8dfe-465e-8065-26822ebfdabd",
        json={
            "status": "in_progress"
        }
    )

    print("Status Code:", response.status_code)
    print("Response:", response.json())

    # Expected correct behavior
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"



def test_rapid_status_updates_concurrency(monkeypatch):

    task_id = "808fada8-8dfe-465e-8065-26822ebfdabd"

    # Reset status so IN_PROGRESS is a genuine database change.
    reset_response = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "TODO"}
    )
    assert reset_response.status_code == 200

    first_request_delayed = threading.Event()
    second_request_completed = threading.Event()

    original_commit = SQLAlchemySession.commit

    def delayed_commit(session):

        dirty_tasks = [
            obj for obj in session.dirty
            if isinstance(obj, Task)
        ]

        is_first_request = any(
            obj.status == TaskStatus.IN_PROGRESS
            for obj in dirty_tasks
        )

        is_second_request = any(
            obj.status == TaskStatus.DONE
            for obj in dirty_tasks
        )

        if is_first_request:
            # Pause the older request before committing.
            first_request_delayed.set()

            assert second_request_completed.wait(timeout=5)

        result = original_commit(session)

        if is_second_request:
            # The newer request has committed successfully.
            second_request_completed.set()

        return result

    monkeypatch.setattr(
        SQLAlchemySession,
        "commit",
        delayed_commit
    )

    def move_to_in_progress():
        return client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "IN_PROGRESS"}
        )

    def move_to_done():
        return client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "DONE"}
        )

    with ThreadPoolExecutor(max_workers=2) as executor:

        first_future = executor.submit(move_to_in_progress)

        # Ensure the first request is delayed.
        assert first_request_delayed.wait(timeout=5)

        # Send the newer request.
        second_future = executor.submit(move_to_done)

        second_response = second_future.result(timeout=10)
        first_response = first_future.result(timeout=10)

    print("First response:", first_response.json())
    print("Second response:", second_response.json())

    assert first_response.status_code == 200
    assert second_response.status_code == 200

    # Check final database state.
    final_response = client.get("/api/v1/tasks")

    final_task = next(
        task for task in final_response.json()
        if task["id"] == task_id
    )

    print("Final task status:", final_task["status"])

    # Older request should overwrite the newer request.
    assert final_task["status"] == "IN_PROGRESS"
