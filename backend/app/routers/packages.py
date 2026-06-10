import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models import User
from app.schemas.common import ApiResponse
from app.schemas.package import (
    AdminStatsResponse,
    FeatureResponse,
    PackageCreate,
    PackageResponse,
    PackageUpdate,
)
from app.services import package_service

router = APIRouter(tags=["packages"])


@router.get("/api/packages", response_model=ApiResponse[list[PackageResponse]])
async def list_public_packages(db: AsyncSession = Depends(get_db)):
    packages = await package_service.list_packages(db)
    return ApiResponse(data=packages, message="Packages retrieved")


@router.get("/api/packages/{package_id}", response_model=ApiResponse[PackageResponse])
async def get_public_package(package_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    package = await package_service.get_package(db, package_id)
    return ApiResponse(data=package, message="Package retrieved")


@router.get("/api/admin/packages", response_model=ApiResponse[list[PackageResponse]])
async def list_admin_packages(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    packages = await package_service.list_packages(db, include_inactive=True)
    return ApiResponse(data=packages, message="Admin packages retrieved")


@router.get("/api/admin/features", response_model=ApiResponse[list[FeatureResponse]])
async def list_admin_features(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    features = await package_service.list_features(db)
    return ApiResponse(data=features, message="Features retrieved")


@router.get("/api/admin/stats", response_model=ApiResponse[AdminStatsResponse])
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stats = await package_service.get_admin_stats(db)
    return ApiResponse(data=stats, message="Admin stats retrieved")


@router.post(
    "/api/admin/packages",
    response_model=ApiResponse[PackageResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_admin_package(
    request: PackageCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    package = await package_service.create_package(db, request)
    return ApiResponse(data=package, message="Package created")


@router.put("/api/admin/packages/{package_id}", response_model=ApiResponse[PackageResponse])
async def update_admin_package(
    package_id: uuid.UUID,
    request: PackageUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    package = await package_service.update_package(db, package_id, request)
    return ApiResponse(data=package, message="Package updated")


@router.delete("/api/admin/packages/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_package(
    package_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await package_service.delete_package(db, package_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
