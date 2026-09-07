from datetime import date, timedelta

import pytest

from tests.conftest import login


def next_monday(offset_weeks: int = 0) -> date:
    today = date.today()
    monday = today - timedelta(days=today.weekday())

    return monday + timedelta(weeks=offset_weeks)


def report_payload(project_id: int, week_offset: int = 0) -> dict:
    start = next_monday(week_offset)

    return {
        "project_id": project_id,
        "week_start": start.isoformat(),
        "week_end": (start + timedelta(days=6)).isoformat(),
        "notes": "A week of work.",
        "links": None,
        "tasks": [
            {
                "task_name": "Build the login flow",
                "priority": "HIGH",
                "planned_percent": 100,
                "actual_percent": 90,
                "status": "IN_PROGRESS",
                "time_planned": 12,
                "time_spent": 14,
                "deliverable": "PR #42",
            }
        ],
        "next_week_tasks": [
            {"description": "Write the tests", "priority": "HIGH"}
        ],
        "blockers": [
            {"description": "Waiting on credentials", "is_key_issue": True}
        ],
        "achievements": [
            {"description": "Cut latency 40%", "is_key_achievement": True}
        ],
        "hours": [
            {"task_type": "Development", "hours": 12},
            {"task_type": "Testing", "hours": 5},
        ],
    }


@pytest.fixture
def draft(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=report_payload(project.project_id),
    )

    assert response.status_code == 201, response.text

    return response.json()


def test_full_lifecycle(client, member, manager, project, draft):
    """DRAFT -> SUBMITTED -> NEEDS_CORRECTION -> SUBMITTED -> APPROVED.

    Exercises the state machine, the authorization rules, versioning
    and the review audit trail in one pass.
    """

    report_id = draft["report_id"]

    assert draft["status"] == "DRAFT"
    assert draft["current_version"]["version_number"] == 1

    # --- the author submits ---
    response = client.post(f"/api/v1/reports/{report_id}/submit")
    assert response.status_code == 200
    assert response.json()["status"] == "SUBMITTED"

    # a submitted report is locked to its author
    assert client.patch(
        f"/api/v1/reports/{report_id}",
        json=report_payload(project.project_id),
    ).status_code == 409

    # the author cannot approve their own report
    assert client.post(
        f"/api/v1/reports/{report_id}/approve", json={}
    ).status_code == 403

    # --- the manager requests changes ---
    login(client, manager.email)

    assert client.post(
        f"/api/v1/reports/{report_id}/request-changes",
        json={"comment": ""},
    ).status_code == 422

    response = client.post(
        f"/api/v1/reports/{report_id}/request-changes",
        json={"comment": "Please add the actual completion percentages."},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "NEEDS_CORRECTION"

    # --- the author corrects and resubmits ---
    login(client, member.email)

    corrected = report_payload(project.project_id)
    corrected["tasks"][0]["actual_percent"] = 100
    corrected.pop("week_start")
    corrected.pop("week_end")

    assert client.patch(
        f"/api/v1/reports/{report_id}", json=corrected
    ).status_code == 200

    response = client.post(f"/api/v1/reports/{report_id}/submit")

    assert response.status_code == 200
    assert response.json()["status"] == "SUBMITTED"
    assert response.json()["current_version"]["version_number"] == 2

    # --- the manager approves ---
    login(client, manager.email)

    response = client.post(
        f"/api/v1/reports/{report_id}/approve",
        json={"comment": "Looks good."},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"
    assert response.json()["approved_at"] is not None

    # --- APPROVED is terminal ---
    assert client.post(
        f"/api/v1/reports/{report_id}/approve", json={}
    ).status_code == 409

    login(client, member.email)

    assert client.post(
        f"/api/v1/reports/{report_id}/submit"
    ).status_code == 409

    assert client.delete(
        f"/api/v1/reports/{report_id}"
    ).status_code == 409


def test_version_one_is_never_overwritten(
    client, member, manager, project, draft
):
    """Phase 14, the assignment's hardest requirement."""

    report_id = draft["report_id"]

    client.post(f"/api/v1/reports/{report_id}/submit")

    login(client, manager.email)
    client.post(
        f"/api/v1/reports/{report_id}/request-changes",
        json={"comment": "Fix the percentages."},
    )

    login(client, member.email)

    corrected = report_payload(project.project_id)
    corrected["tasks"][0]["task_name"] = "Build the login flow (revised)"
    corrected["tasks"][0]["actual_percent"] = 100
    corrected.pop("week_start")
    corrected.pop("week_end")

    client.patch(f"/api/v1/reports/{report_id}", json=corrected)
    client.post(f"/api/v1/reports/{report_id}/submit")

    history = client.get(f"/api/v1/reports/{report_id}/versions").json()
    versions = history["versions"]

    assert len(versions) == 2
    assert [v["version_number"] for v in versions] == [1, 2]
    assert [v["is_current"] for v in versions] == [False, True]

    # version 1 still holds the ORIGINAL content
    v1_task = versions[0]["tasks"][0]
    assert v1_task["task_name"] == "Build the login flow"
    assert float(v1_task["actual_percent"]) == 90

    # version 2 holds the correction
    v2_task = versions[1]["tasks"][0]
    assert v2_task["task_name"] == "Build the login flow (revised)"
    assert float(v2_task["actual_percent"]) == 100

    # each review points at the version it reviewed
    reviews = client.get(f"/api/v1/reports/{report_id}/reviews").json()

    assert len(reviews) == 1
    assert reviews[0]["action"] == "REQUEST_CHANGES"
    assert reviews[0]["version_number"] == 1
