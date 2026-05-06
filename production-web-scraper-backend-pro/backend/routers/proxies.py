```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.dependencies import get_current_active_admin_user
from backend.services import crud
from backend.schemas.proxy import ProxyCreate, ProxyUpdate, ProxyInDB
from backend.schemas.common import PaginatedResponse
from backend.models.user import User
from backend.models.proxy import Proxy
from backend.core.logger import logger

router = APIRouter()

@router.post("/", response_model=ProxyInDB, status_code=status.HTTP_201_CREATED, summary="Create a new proxy (Admin only)")
async def create_proxy(
    proxy_in: ProxyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Create a new proxy configuration. Only administrators can perform this action.
    """
    # Check for existing proxy with same address and port
    existing_proxy = db.query(Proxy).filter(Proxy.address == str(proxy_in.address), Proxy.port == proxy_in.port).first()
    if existing_proxy:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Proxy with this address and port already exists")
    
    proxy = crud.proxy.create(db, proxy_in)
    logger.info(f"Admin {current_user.username} created proxy {proxy.address}:{proxy.port} (ID: {proxy.id}).")
    return ProxyInDB.model_validate(proxy)

@router.get("/", response_model=PaginatedResponse[ProxyInDB], summary="Get all proxies (Admin only)")
async def read_proxies(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve all proxy configurations with pagination. Only administrators can perform this action.
    """
    proxies, total = crud.proxy.get_multi_with_count(db, skip=skip, limit=limit)
    logger.info(f"Admin {current_user.username} retrieved {len(proxies)} proxies.")
    return PaginatedResponse(total=total, page=skip // limit + 1, page_size=limit, items=[ProxyInDB.model_validate(p) for p in proxies])

@router.get("/{proxy_id}", response_model=ProxyInDB, summary="Get proxy by ID (Admin only)")
async def read_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Retrieve a specific proxy by ID. Only administrators can perform this action.
    """
    proxy = crud.proxy.get(db, proxy_id)
    if not proxy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")
    logger.info(f"Admin {current_user.username} retrieved proxy {proxy.address}:{proxy.port} (ID: {proxy.id}).")
    return ProxyInDB.model_validate(proxy)

@router.put("/{proxy_id}", response_model=ProxyInDB, summary="Update a proxy (Admin only)")
async def update_proxy(
    proxy_id: int,
    proxy_in: ProxyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Update an existing proxy by ID. Only administrators can perform this action.
    """
    proxy = crud.proxy.get(db, proxy_id)
    if not proxy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")

    updated_proxy = crud.proxy.update(db, proxy, proxy_in)
    logger.info(f"Admin {current_user.username} updated proxy {updated_proxy.address}:{updated_proxy.port} (ID: {updated_proxy.id}).")
    return ProxyInDB.model_validate(updated_proxy)

@router.delete("/{proxy_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a proxy (Admin only)")
async def delete_proxy(
    proxy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin_user)
):
    """
    Delete a proxy by ID. Only administrators can perform this action.
    """
    proxy = crud.proxy.get(db, proxy_id)
    if not proxy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")
    
    crud.proxy.remove(db, proxy_id)
    logger.info(f"Admin {current_user.username} deleted proxy ID: {proxy_id}.")
    return
```