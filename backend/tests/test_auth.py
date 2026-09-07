def test_register_creates_team_member(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "New",
            "last_name": "Person",
            "email": "new@example.com",
            "password": "Password123",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "TEAM_MEMBER"


def test_register_rejects_duplicate_email(client, member):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Copy",
            "last_name": "Cat",
            "email": member.email,
            "password": "Password123",
        },
    )

    assert response.status_code == 409


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "A",
            "last_name": "B",
            "email": "short@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_register_cannot_self_assign_admin(client):
    """Phase 18: role is not accepted from the request body."""

    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Sneaky",
            "last_name": "Person",
            "email": "sneaky@example.com",
            "password": "Password123",
            "role": "ADMIN",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "TEAM_MEMBER"


def test_login_sets_httponly_cookies(client, member):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": member.email, "password": "Password123"},
    )

    assert response.status_code == 200

    cookies = response.headers.get_list("set-cookie")
    joined = " ".join(cookies)

    assert "access_token=" in joined
    assert "refresh_token=" in joined
    assert joined.lower().count("httponly") >= 2


def test_login_rejects_wrong_password(client, member):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": member.email, "password": "WrongPassword"},
    )

    assert response.status_code == 401


def test_login_does_not_leak_account_existence(client, member):
    """Both failures must produce the same message."""

    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": member.email, "password": "WrongPassword"},
    )

    no_such_user = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPassword"},
    )

    assert wrong_password.status_code == no_such_user.status_code
    assert wrong_password.json()["detail"] == no_such_user.json()["detail"]


def test_me_requires_authentication(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_logout_clears_the_session(as_member):
    assert as_member.post("/api/v1/auth/logout").status_code == 200
    assert as_member.get("/api/v1/auth/me").status_code == 401


def test_inactive_user_cannot_log_in(client, db, member):
    member.is_active = False
    db.flush()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": member.email, "password": "Password123"},
    )

    assert response.status_code == 403
