from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.user import router as user_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(user_router)
#api_router.include_router(project_router)
#api_router.include_router(report_router)
#api_router.include_router(review_router)
#api_router.include_router(dashboard_router)