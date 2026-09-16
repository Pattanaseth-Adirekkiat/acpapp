from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from database import (
    buy_product,
    create_product,
    delete_product,
    get_all_products,
    update_product,
)

router = APIRouter(prefix="/products", tags=["products"])


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    created_at: datetime


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int


@router.get("", response_model=List[ProductResponse])
async def get_products():
    return await get_all_products()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(payload: ProductCreate):
    return await create_product(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def edit_product(product_id: int, payload: ProductCreate):
    updated = await update_product(
        product_id=product_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return updated


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product(product_id: int):
    deleted = await delete_product(product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return None


@router.post("/{product_id}/buy", response_model=ProductResponse)
async def purchase_product(product_id: int):
    updated = await buy_product(product_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not found or out of stock",
        )
    return updated