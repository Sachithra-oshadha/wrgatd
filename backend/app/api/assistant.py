from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import require_manager
from app.core.database import get_db
from app.models.user import User
from app.services import assistant_service


router = APIRouter(
    prefix="/assistant",
    tags=["Assistant"],
)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    weeks: int = Field(default=4, ge=1, le=12)


class AskResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=AskResponse)
def ask(
    data: AskRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return {
        "answer": assistant_service.ask(
            db, data.question, weeks=data.weeks
        )
    }
