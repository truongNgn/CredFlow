from fastapi import APIRouter, Depends

from app.middleware.feature_guard import require_feature
from app.models import User
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/api/features", tags=["features"])


@router.post("/generate-image")
async def generate_image(_: User = Depends(require_feature("image_generation"))):
    return ApiResponse(
        data={"url": "https://placehold.co/1024x1024", "status": "generated"},
        message="Image generation simulated",
    )


@router.post("/auto-post")
async def auto_post(_: User = Depends(require_feature("auto_post"))):
    return ApiResponse(
        data={"status": "scheduled", "scheduled_for": "next available slot"},
        message="Auto post simulated",
    )


@router.get("/analytics")
async def analytics(_: User = Depends(require_feature("analytics"))):
    return ApiResponse(
        data={"views": 12480, "engagement_rate": 7.4, "trend": "up"},
        message="Analytics retrieved",
    )
