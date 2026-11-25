
from fastapi.testclient import TestClient
from app.main import app

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
