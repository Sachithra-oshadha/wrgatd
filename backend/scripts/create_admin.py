"""Create the first ADMIN account.

/auth/register always creates a TEAM_MEMBER, and POST /api/v1/users
requires an existing admin, so something has to break that circle.

Usage (from backend/, with the venv active):

    python -m scripts.create_admin admin@example.com "Str0ngPassw0rd" Ada Lovelace

Idempotent: run it against an existing email and it promotes that
account to ADMIN instead of failing on the unique email constraint.
"""

import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__)
        return 1

    email, password, first_name, last_name = sys.argv[1:5]
    email = email.strip().lower()

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return 1

    db = SessionLocal()

    try:
        existing = db.scalar(
            select(User).where(User.email == email)
        )

        if existing:
            existing.role = UserRole.ADMIN
            existing.is_active = True
            db.commit()

            print(f"Promoted existing user {email} to ADMIN.")
            return 0

        user = User(
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

        db.add(user)
        db.commit()

        print(f"Created ADMIN {email}.")
        return 0

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
