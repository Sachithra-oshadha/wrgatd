"""fix user role enum

Revision ID: 5b200b8697f8
Revises: 202aa696c5b2
Create Date: 2026-09-04 20:08:59.074318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b200b8697f8'
down_revision: Union[str, Sequence[str], None] = '202aa696c5b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type
    user_role_enum = sa.Enum(
        "TEAM_MEMBER",
        "ADMIN",
        "MANAGER",
        name="user_role",
    )

    user_role_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    # Convert existing VARCHAR column to enum
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

    # Remove enum
    user_role_enum = sa.Enum(
        "TEAM_MEMBER",
        "ADMIN",
        "MANAGER",
        name="user_role",
    )

    user_role_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )
