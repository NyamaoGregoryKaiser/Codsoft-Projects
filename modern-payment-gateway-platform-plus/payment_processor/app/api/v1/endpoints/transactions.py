from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter

from app.schemas.transaction import TransactionCreate, TransactionPublic, TransactionStatusUpdate
from app.schemas.user import UserPublic
from app.schemas.common import Message
from app.database.dependencies import get_db_session
from app.core.security import get_current_active_user, get_current_active_merchant_user
from app.services.transaction_service import TransactionService
from app.core.logger import get_logger
from app.core.exceptions import APIException, NotFoundException, PermissionDeniedException, PaymentGatewayException

logger = get_logger(__name__)

router = APIRouter()

@router.post(
    "/initiate",
    response_model=TransactionPublic,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Initiate a new payment transaction",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))] # 5 requests per minute
)
async def initiate_payment(
    transaction_in: TransactionCreate,
    current_merchant: UserPublic = Depends(get_current_active_merchant_user), # Ensures only merchants can initiate
    db: AsyncSession = Depends(get_db_session),
    transaction_service: TransactionService = Depends(TransactionService)
) -> Any:
    """
    Initiates a new payment transaction.
    - Requires `merchant_id` to match the authenticated merchant.
    - Tokenizes card data if not already a token.
    - Submits to a payment gateway (mocked here).
    - Returns an initial transaction status (e.g., PENDING).
    """
    if transaction_in.merchant_id != current_merchant.merchant.id:
        raise PermissionDeniedException("You can only initiate transactions for your own merchant account.")

    logger.info(f"Initiating payment for merchant {current_merchant.merchant.id} and customer {transaction_in.customer_id}")
    try:
        transaction = await transaction_service.initiate_transaction(db, transaction_in, current_merchant.id)
        return transaction
    except PaymentGatewayException as e:
        logger.error(f"Payment gateway error during initiation: {e}")
        raise APIException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Payment gateway error: {e.detail}")
    except Exception as e:
        logger.error(f"Error initiating payment: {e}", exc_info=True)
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to initiate payment due to an internal error.")


@router.get(
    "/{transaction_id}",
    response_model=TransactionPublic,
    summary="Get details of a specific transaction"
)
async def get_transaction(
    transaction_id: UUID,
    current_merchant: UserPublic = Depends(get_current_active_merchant_user),
    db: AsyncSession = Depends(get_db_session),
    transaction_service: TransactionService = Depends(TransactionService)
) -> Any:
    """
    Retrieves the details of a specific transaction by its ID.
    - Only accessible by the merchant who owns the transaction.
    """
    transaction = await transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise NotFoundException(detail="Transaction not found.")
    if transaction.merchant_id != current_merchant.merchant.id:
        raise PermissionDeniedException("You do not have permission to view this transaction.")
    return transaction

@router.post(
    "/{transaction_id}/capture",
    response_model=TransactionPublic,
    summary="Capture an authorized transaction"
)
async def capture_transaction(
    transaction_id: UUID,
    current_merchant: UserPublic = Depends(get_current_active_merchant_user),
    db: AsyncSession = Depends(get_db_session),
    transaction_service: TransactionService = Depends(TransactionService)
) -> Any:
    """
    Captures a previously authorized transaction, finalizing the payment.
    - Only applicable to transactions in 'AUTHORIZED' status.
    """
    transaction = await transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise NotFoundException("Transaction not found.")
    if transaction.merchant_id != current_merchant.merchant.id:
        raise PermissionDeniedException("You do not have permission to capture this transaction.")

    logger.info(f"Capturing transaction {transaction_id} for merchant {current_merchant.merchant.id}")
    try:
        captured_transaction = await transaction_service.capture_transaction(db, transaction)
        return captured_transaction
    except PaymentGatewayException as e:
        raise APIException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Payment gateway error during capture: {e.detail}")
    except APIException as e:
        raise e
    except Exception as e:
        logger.error(f"Error capturing transaction {transaction_id}: {e}", exc_info=True)
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to capture payment.")


@router.post(
    "/{transaction_id}/refund",
    response_model=TransactionPublic,
    summary="Refund a captured transaction"
)
async def refund_transaction(
    transaction_id: UUID,
    current_merchant: UserPublic = Depends(get_current_active_merchant_user),
    db: AsyncSession = Depends(get_db_session),
    transaction_service: TransactionService = Depends(TransactionService)
) -> Any:
    """
    Refunds a previously captured transaction.
    - Only applicable to transactions in 'CAPTURED' or 'PARTIALLY_REFUNDED' status.
    """
    transaction = await transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise NotFoundException("Transaction not found.")
    if transaction.merchant_id != current_merchant.merchant.id:
        raise PermissionDeniedException("You do not have permission to refund this transaction.")

    logger.info(f"Refunding transaction {transaction_id} for merchant {current_merchant.merchant.id}")
    try:
        refunded_transaction = await transaction_service.refund_transaction(db, transaction)
        return refunded_transaction
    except PaymentGatewayException as e:
        raise APIException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Payment gateway error during refund: {e.detail}")
    except APIException as e:
        raise e
    except Exception as e:
        logger.error(f"Error refunding transaction {transaction_id}: {e}", exc_info=True)
        raise APIException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to refund payment.")


@router.get(
    "/merchant/{merchant_id}",
    response_model=List[TransactionPublic],
    summary="Get all transactions for a specific merchant"
)
async def get_merchant_transactions(
    merchant_id: UUID,
    current_merchant: UserPublic = Depends(get_current_active_merchant_user),
    db: AsyncSession = Depends(get_db_session),
    transaction_service: TransactionService = Depends(TransactionService)
) -> List[TransactionPublic]:
    """
    Retrieves all transactions associated with a specific merchant.
    - Only accessible by the merchant itself.
    """
    if merchant_id != current_merchant.merchant.id:
        raise PermissionDeniedException("You can only view transactions for your own merchant account.")
    
    transactions = await transaction_service.get_merchant_transactions(db, merchant_id)
    return transactions

```

#### `payment_processor/app/services/transaction_service.py`
```python