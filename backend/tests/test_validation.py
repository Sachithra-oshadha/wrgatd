import pytest

from tests.test_workflow import report_payload


def mutate(project_id, **changes):
    payload = report_payload(project_id)
    payload.update(changes)
    return payload


def mutate_task(project_id, **changes):
    payload = report_payload(project_id)
    payload["tasks"][0].update(changes)
    return payload


@pytest.mark.parametrize(
    "field,value",
    [
        ("planned_percent", 101),
        ("planned_percent", -1),
        ("actual_percent", 101),
        ("actual_percent", -5),
        ("time_planned", -1),
        ("time_spent", -3),
        ("task_name", "   "),
    ],
)
def test_task_field_validation(as_member, project, field, value):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate_task(project.project_id, **{field: value}),
    )

    assert response.status_code == 422


def test_negative_hours_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            hours=[{"task_type": "Development", "hours": -1}],
        ),
    )

    assert response.status_code == 422


def test_duplicate_hours_category_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            hours=[
                {"task_type": "Development", "hours": 5},
                {"task_type": "development", "hours": 3},
            ],
        ),
    )

    assert response.status_code == 422


def test_two_key_blockers_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            blockers=[
                {"description": "One", "is_key_issue": True},
                {"description": "Two", "is_key_issue": True},
            ],
        ),
    )

    assert response.status_code == 422


def test_two_key_achievements_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            achievements=[
                {"description": "One", "is_key_achievement": True},
                {"description": "Two", "is_key_achievement": True},
            ],
        ),
    )

    assert response.status_code == 422


def test_non_monday_week_start_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            week_start="2026-09-01",
            week_end="2026-09-07",
        ),
    )

    assert response.status_code == 422


def test_reversed_week_rejected(as_member, project):
    response = as_member.post(
        "/api/v1/reports",
        json=mutate(
            project.project_id,
            week_start="2026-09-07",
            week_end="2026-08-31",
        ),
    )

    assert response.status_code == 422


def test_duplicate_week_rejected(as_member, project):
    payload = report_payload(project.project_id)

    assert as_member.post("/api/v1/reports", json=payload).status_code == 201
    assert as_member.post("/api/v1/reports", json=payload).status_code == 409


def test_empty_report_cannot_be_submitted(as_member, project):
    payload = report_payload(project.project_id)
    payload["tasks"] = []
    payload["achievements"] = []

    report = as_member.post("/api/v1/reports", json=payload).json()

    response = as_member.post(
        f"/api/v1/reports/{report['report_id']}/submit"
    )

    assert response.status_code == 422
