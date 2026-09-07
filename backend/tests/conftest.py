import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  - register all mappers
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.project import Project
from app.models.user import User, UserRole


TEST_URL = settings.test_database_url or os.environ.get(
    "TEST_DATABASE_URL"
)

if not TEST_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL must be set - never run tests against the "
        "development database."
    )


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(TEST_URL, pool_pre_ping=True)

    # The user_role enum is created by a migration, not by metadata,
    # so create it explicitly before create_all.
    with engine.begin() as connection:
        connection.execute(
            text(
                "DO $$ BEGIN "
                "CREATE TYPE user_role AS ENUM "
                "('TEAM_MEMBER', 'ADMIN', 'MANAGER'); "
                "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
            )
        )

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    yield engine

    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine):
    """A session bound to a transaction that is rolled back after the test.

    Nothing a test writes survives it, so tests never see each other's
    data and order never matters.
    """

    connection = engine.connect()
    transaction = connection.begin()

    Session = sessionmaker(bind=connection, autoflush=False)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    """A TestClient whose requests share the test's transaction."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

# NOTE: use a real public domain. Pydantic's EmailStr rejects the
# special-use domains .local / .test / .invalid / localhost, so
# "member@test.local" fails registration with a 422.

def _make_user(
    db,
    email: str,
    role: UserRole,
    first_name: str = "Test",
    last_name: str = "User",
) -> User:
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=hash_password("Password123"),
        role=role,
        is_active=True,
    )

    db.add(user)
    db.flush()

    return user


@pytest.fixture
def member(db):
    return _make_user(db, "member@example.com", UserRole.TEAM_MEMBER, "Mia")


@pytest.fixture
def other_member(db):
    return _make_user(db, "other@example.com", UserRole.TEAM_MEMBER, "Otto")


@pytest.fixture
def manager(db):
    return _make_user(db, "manager@example.com", UserRole.MANAGER, "Mo")


@pytest.fixture
def admin(db):
    return _make_user(db, "admin@example.com", UserRole.ADMIN, "Ada")


@pytest.fixture
def project(db):
    project = Project(
        name="Client A",
        description="Test project",
        is_active=True,
    )

    db.add(project)
    db.flush()

    return project


def login(client, email: str, password: str = "Password123") -> None:
    """Authenticate the TestClient. Cookies persist on the client."""

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert response.status_code == 200, response.text


@pytest.fixture
def as_member(client, member):
    login(client, member.email)
    return client


@pytest.fixture
def as_other_member(client, other_member):
    login(client, other_member.email)
    return client


@pytest.fixture
def as_manager(client, manager):
    login(client, manager.email)
    return client


@pytest.fixture
def as_admin(client, admin):
    login(client, admin.email)
    return client
