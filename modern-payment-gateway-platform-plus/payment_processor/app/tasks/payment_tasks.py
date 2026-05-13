import os
import asyncio
from uuid import UUID
from decimal import Decimal

from celery import Celery
from celery.signals import task_postrun
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.logger import get_logger
from app.database.engine import async_engine
from app.schemas.transaction import TransactionStatus
from app.services.payment_gateway import PaymentGatewayService
from app.crud.transaction import crud_transaction
from app.services.webhook_service import WebhookService

logger = get_logger(__name__)

# Initialize Celery app
celery_app = Celery(
    "payment_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)
celery_app.conf.update(
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    worker_log_format='[%(asctime)s: %(levelname)s/%(processName)s] %(message)s',
    worker_task_log_format='[%(asctime)s: %(levelname)s/%(processName)s] Task %(task_name)s[%(task_id)s] %(message)s',
)

# Create an async session maker for tasks
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# --- Celery Tasks ---

@celery_app.task(bind=True, max_retries=settings.CELERY_MAX_RETRIES, default_retry_delay=settings.CELERY_RETRY_DELAY_SECONDS)
async def process_payment_with_gateway_task(
    self,
    transaction_id: str,
    payment_method_token: str,
    amount: float, # Celery expects serializable types
    currency: str,
    merchant_reference: str,
    customer_reference: str
):
    """
    Asynchronously processes a payment with the mocked payment gateway.
    Updates transaction status based on gateway response.
    """
    logger.info(f"Celery task starting: process_payment_with_gateway_task for transaction {transaction_id}")
    db: AsyncSession | None = None
    try:
        db = AsyncSessionLocal()
        transaction_uuid = UUID(transaction_id)
        payment_gateway = PaymentGatewayService()
        webhook_service = WebhookService()

        # Call the mocked payment gateway
        gateway_response = await payment_gateway.process_payment(
            token=payment_method_token,
            amount=Decimal(str(amount)), # Convert back to Decimal for business logic
            currency=currency
        )
        
        new_status = TransactionStatus.PENDING # Default
        if gateway_response["success"]:
            gateway_transaction_id = gateway_response.get("gateway_transaction_id")
            if gateway_response["status"] == "captured":
                new_status = TransactionStatus.CAPTURED
            elif gateway_response["status"] == "authorized":
                new_status = TransactionStatus.AUTHORIZED
            logger.info(f"Gateway processed transaction {transaction_id} successfully. Status: {new_status}")
        else:
            new_status = TransactionStatus.FAILED
            logger.error(f"Gateway failed to process transaction {transaction_id}. Message: {gateway_response.get('message')}")
            gateway_transaction_id = None # No gateway ID if failed early

        # Update transaction in DB
        transaction = await crud_transaction.get(db, transaction_uuid)
        if transaction:
            update_data = {
                "status": new_status,
                "gateway_transaction_id": gateway_transaction_id,
                "gateway_response": gateway_response,
                "updated_at": datetime.utcnow()
            }
            updated_transaction = await crud_transaction.update(db, db_obj=transaction, obj_in=update_data)
            await db.commit() # Commit changes
            await db.refresh(updated_transaction)
            logger.info(f"Transaction {transaction_id} updated to status {new_status}.")
            
            # Send webhook to merchant (asynchronously)
            await webhook_service.send_transaction_update_webhook(db, updated_transaction)
        else:
            logger.error(f"Transaction {transaction_id} not found in DB after gateway processing.")

    except Exception as exc:
        logger.error(f"Error processing payment for transaction {transaction_id}: {exc}", exc_info=True)
        # Attempt to update transaction status to FAILED if it's still PENDING
        try:
            if db:
                transaction = await crud_transaction.get(db, UUID(transaction_id))
                if transaction and transaction.status == TransactionStatus.PENDING:
                    await crud_transaction.update(db, db_obj=transaction, obj_in={"status": TransactionStatus.FAILED, "updated_at": datetime.utcnow()})
                    await db.commit()
                    logger.warning(f"Transaction {transaction_id} status forced to FAILED due to task error.")
        except Exception as rollback_exc:
            logger.error(f"Failed to update transaction {transaction_id} to FAILED during error handling: {rollback_exc}")

        # Retry the task if eligible
        try:
            # Re-raise for Celery's retry mechanism.
            # self.request.retries gives current retry attempt number
            logger.info(f"Retrying task process_payment_with_gateway_task for {transaction_id}. Attempt {self.request.retries + 1}/{settings.CELERY_MAX_RETRIES}")
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.critical(f"Max retries exceeded for transaction {transaction_id}. Final status could be inconsistent.", exc_info=True)
            # Potentially send an alert or log to a dedicated error queue
        except Exception as retry_exc:
            logger.error(f"Failed during task retry logic: {retry_exc}", exc_info=True)
    finally:
        if db:
            await db.close()
            logger.debug(f"DB session for task {self.request.id} closed.")

@celery_app.task(bind=True, max_retries=settings.CELERY_MAX_RETRIES, default_retry_delay=settings.CELERY_RETRY_DELAY_SECONDS)
async def send_merchant_webhook_task(self, webhook_event_id: str):
    """
    Sends a webhook notification to the merchant.
    """
    logger.info(f"Celery task starting: send_merchant_webhook_task for event {webhook_event_id}")
    db: AsyncSession | None = None
    try:
        db = AsyncSessionLocal()
        webhook_service = WebhookService()
        await webhook_service.process_and_send_webhook_event(db, UUID(webhook_event_id))
        logger.info(f"Webhook event {webhook_event_id} processed and sent successfully.")
    except Exception as exc:
        logger.error(f"Error sending webhook for event {webhook_event_id}: {exc}", exc_info=True)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.critical(f"Max retries exceeded for webhook event {webhook_event_id}. Webhook may not have been delivered.", exc_info=True)
    finally:
        if db:
            await db.close()

# @task_postrun.connect
# def close_celery_db_session(*args, **kwargs):
#     """
#     Signal handler to close the DB session after a task runs.
#     This is crucial for asynchronous sessions.
#     """
#     # This might be tricky with async sessions, as the session should be closed
#     # within the async context. The 'finally' block in tasks is usually better.
#     # Leaving this commented out but noting the consideration.
#     pass

```

#### `payment_processor/app/core/config.py`
```python