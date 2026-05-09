```python
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_active_user
from app.crud.product import crud_product
from app.crud.review import crud_review
from app.schemas.review import ReviewCreate, ReviewPublic, ReviewUpdate
from app.schemas.user import UserPublic
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.post("/", response_model=ReviewPublic, status_code=status.HTTP_201_CREATED)
def create_review(
    *,
    db: Session = Depends(get_db),
    review_in: ReviewCreate,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Create a new product review.
    A user can only submit one review per product.
    """
    product = crud_product.get(db, id=review_in.product_id)
    if not product:
        logger.warning(f"User {current_user.email} attempted to review non-existent product ID {review_in.product_id}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing_review = crud_review.get_by_user_and_product(db, user_id=current_user.id, product_id=review_in.product_id)
    if existing_review:
        logger.warning(f"User {current_user.email} attempted to submit a second review for product ID {review_in.product_id}.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this product.")

    review = crud_review.create_with_owner(db, obj_in=review_in, user_id=current_user.id)
    logger.info(f"User {current_user.email} submitted a review for product ID {review_in.product_id}.")
    return review


@router.get("/product/{product_id}", response_model=List[ReviewPublic])
def get_reviews_for_product(
    product_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all reviews for a specific product.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"Attempted to retrieve reviews for non-existent product ID {product_id}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    reviews = crud_review.get_multi_by_product(db, product_id=product_id, skip=skip, limit=limit)
    logger.info(f"Retrieved {len(reviews)} reviews for product ID {product_id}.")
    return reviews


@router.get("/{review_id}", response_model=ReviewPublic)
def get_review_by_id(
    review_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific review by its ID.
    """
    review = crud_review.get(db, id=review_id)
    if not review:
        logger.warning(f"Review with ID {review_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    logger.info(f"Retrieved review with ID {review_id}.")
    return review


@router.put("/{review_id}", response_model=ReviewPublic)
def update_review(
    *,
    db: Session = Depends(get_db),
    review_id: int,
    review_in: ReviewUpdate,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Update an existing review. Only the owner of the review can update it.
    """
    review = crud_review.get(db, id=review_id)
    if not review:
        logger.warning(f"User {current_user.email} attempted to update non-existent review ID {review_id}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        logger.warning(f"User {current_user.email} attempted to update review ID {review_id} which they do not own.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this review")

    review = crud_review.update(db, db_obj=review, obj_in=review_in)
    logger.info(f"User {current_user.email} updated review ID {review_id}.")
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    *,
    db: Session = Depends(get_db),
    review_id: int,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Delete an existing review. Only the owner of the review can delete it.
    Superusers can also delete any review.
    """
    review = crud_review.get(db, id=review_id)
    if not review:
        logger.warning(f"User {current_user.email} attempted to delete non-existent review ID {review_id}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id and not current_user.is_superuser:
        logger.warning(f"User {current_user.email} attempted to delete review ID {review_id} which they do not own and are not superuser.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this review")

    crud_review.remove(db, id=review_id)
    logger.info(f"Review ID {review_id} deleted by user {current_user.email}.")
    return {"message": "Review deleted successfully"}

```