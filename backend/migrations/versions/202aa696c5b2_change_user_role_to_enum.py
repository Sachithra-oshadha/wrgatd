"""change user role to enum

Revision ID: 202aa696c5b2
Revises: e618b7eaaa39
Create Date: 2026-09-04 19:44:49.556455

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '202aa696c5b2'
down_revision: Union[str, Sequence[str], None] = 'e618b7eaaa39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create PostgreSQL enum type
    user_role_enum = sa.Enum(
        "TEAM_MEMBER",
        "ADMIN",
        "MANAGER",
        name="user_role",
    )

    user_role_enum.create(op.get_bind(), checkfirst=True)

    # Convert existing role column from VARCHAR to the enum
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=20),
        type_=user_role_enum,
        existing_nullable=False,
        postgresql_using="role::user_role",
    )


def downgrade() -> None:
    # Convert enum back to VARCHAR
    op.alter_column(
        "users",
        "role",
        existing_type=sa.Enum(
            "TEAM_MEMBER",
            "ADMIN",
            "MANAGER",
            name="user_role",
        ),
        type_=sa.String(length=20),
        existing_nullable=False,
        postgresql_using="role::text",
    )

    # Remove PostgreSQL enum type
    user_role_enum = sa.Enum(
        "TEAM_MEMBER",
        "ADMIN",
        "MANAGER",
        name="user_role",
    )

    user_role_enum.drop(op.get_bind(), checkfirst=True)
