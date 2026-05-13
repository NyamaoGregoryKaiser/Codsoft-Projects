from typing import List
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.transaction import crud_transaction
from app.crud.payment_method import crud_payment_method
from app.crud.customer import crud_customer
from app.schemas.transaction import TransactionCreate, TransactionStatus, TransactionPublic
from app.schemas.payment_method import PaymentMethodType
from app.database.models import Transaction, PaymentMethod, Customer
from app.core.logger import get_logger
from app.core.exceptions import APIException, NotFoundException, PaymentGatewayException
from app.services.payment_gateway import PaymentGatewayService # Mocked external service
from app.tasks.payment_tasks import process_payment_with_gateway_task

logger = get_logger(__name__)

class TransactionService:
    def __init__(self, payment_gateway: PaymentGatewayService = PaymentGatewayService()):
        self.payment_gateway = payment_gateway

    async def _get_payment_method_or_create_token(
        self, db: AsyncSession, transaction_in: TransactionCreate, user_id: UUID
    ) -> PaymentMethod:
        """
        Retrieves an existing payment method or creates a new tokenized one.
        PCI Compliance Note: Real systems would send card data directly to a PCI-compliant
        gateway's JS SDK to get a token, never touching the backend. Here, we simulate
        the tokenization process.
        """
        if transaction_in.payment_method_id:
            payment_method = await crud_payment_method.get(db, transaction_in.payment_method_id)
            if not payment_method or payment_method.customer_id != transaction_in.customer_id:
                raise NotFoundException("Payment method not found or does not belong to the customer.")
            return payment_method
        elif transaction_in.card_details:
            # Simulate tokenization - In a real system, card details would be sent
            # directly from the frontend to the payment gateway to get a token.
            # This backend should *NEVER* directly receive or store raw card details.
            # For this demo, we simulate a token being generated on the server side.
            logger.warning("Simulating server-side tokenization. In production, use client-side tokenization!")
            card_token = await self.payment_gateway.tokenize_card(transaction_in.card_details)
            if not card_token:
                raise APIException(status_code=500, detail="Failed to tokenize card details.")

            # Check if customer exists
            customer = await crud_customer.get(db, transaction_in.customer_id)
            if not customer:
                raise NotFoundException("Customer not found for payment method creation.")

            # Create a new tokenized payment method
            payment_method_obj_in = {
                "customer_id": transaction_in.customer_id,
                "type": PaymentMethodType.card,
                "token": card_token,
                "last4": transaction_in.card_details.card_number[-4:],
                "expiry_month": transaction_in.card_details.expiry_month,
                "expiry_year": transaction_in.card_details.expiry_year,
                "brand": "Visa" # Placeholder
            }
            return await crud_payment_method.create(db, obj_in=payment_method_obj_in)
        else:
            raise APIException(status_code=400, detail="Either payment_method_id or card_details must be provided.")

    async def initiate_transaction(
        self, db: AsyncSession, transaction_in: TransactionCreate, user_id: UUID
    ) -> Transaction:
        """
        Initiates a payment transaction.
        1. Validates payment method (gets existing or tokenizes new card details).
        2. Creates a PENDING transaction in the database.
        3. Dispatches an async task to the payment gateway.
        """
        # Ensure customer belongs to the merchant
        customer = await crud_customer.get(db, transaction_in.customer_id)
        if not customer or customer.merchant_id != transaction_in.merchant_id:
            raise NotFoundException("Customer not found or does not belong to the specified merchant.")

        payment_method = await self._get_payment_method_or_create_token(db, transaction_in, user_id)

        # Create the transaction in the database with PENDING status
        transaction_data = {
            "merchant_id": transaction_in.merchant_id,
            "customer_id": transaction_in.customer_id,
            "payment_method_id": payment_method.id,
            "amount": transaction_in.amount,
            "currency": transaction_in.currency,
            "status": TransactionStatus.PENDING,
            "description": transaction_in.description,
            "metadata": transaction_in.metadata,
        }
        transaction = await crud_transaction.create(db, obj_in=transaction_data)
        await db.refresh(transaction) # Ensure related objects are loaded for task if needed

        # Dispatch async task to process payment with gateway
        # This makes the API response fast and handles long-running gateway calls
        process_payment_with_gateway_task.delay(
            transaction_id=str(transaction.id),
            payment_method_token=payment_method.token,
            amount=float(transaction.amount), # Celery requires serializable types
            currency=transaction.currency,
            merchant_reference=str(transaction.merchant_id),
            customer_reference=str(transaction.customer_id)
        )
        logger.info(f"Transaction {transaction.id} initiated and async task dispatched.")
        return transaction

    async def update_transaction_status(
        self, db: AsyncSession, transaction_id: UUID, new_status: TransactionStatus,
        gateway_transaction_id: str | None = None, gateway_response: dict | None = None
    ) -> Transaction:
        """
        Updates the status of a transaction and adds gateway details.
        """
        transaction = await crud_transaction.get(db, transaction_id)
        if not transaction:
            raise NotFoundException(f"Transaction with ID {transaction_id} not found.")

        update_data = {"status": new_status}
        if gateway_transaction_id:
            update_data["gateway_transaction_id"] = gateway_transaction_id
        if gateway_response:
            update_data["gateway_response"] = gateway_response

        updated_transaction = await crud_transaction.update(db, db_obj=transaction, obj_in=update_data)
        await db.refresh(updated_transaction)
        logger.info(f"Transaction {transaction_id} status updated to {new_status}")
        return updated_transaction

    async def get_transaction_by_id(self, db: AsyncSession, transaction_id: UUID) -> Transaction | None:
        """Retrieves a transaction by its ID."""
        return await crud_transaction.get(db, transaction_id)

    async def get_merchant_transactions(self, db: AsyncSession, merchant_id: UUID) -> List[Transaction]:
        """Retrieves all transactions for a given merchant."""
        return await crud_transaction.get_multi_by_merchant(db, merchant_id=merchant_id)

    async def capture_transaction(self, db: AsyncSession, transaction: Transaction) -> Transaction:
        """
        Captures an authorized transaction.
        """
        if transaction.status != TransactionStatus.AUTHORIZED:
            raise APIException(status_code=400, detail="Only 'AUTHORIZED' transactions can be captured.")

        # Simulate interaction with payment gateway to capture
        gateway_res = await self.payment_gateway.capture_payment(
            transaction.gateway_transaction_id, transaction.amount, transaction.currency
        )

        if gateway_res.get("success"):
            updated_transaction = await self.update_transaction_status(
                db, transaction.id, TransactionStatus.CAPTURED,
                gateway_response=gateway_res
            )
            return updated_transaction
        else:
            await self.update_transaction_status(
                db, transaction.id, TransactionStatus.FAILED,
                gateway_response=gateway_res
            )
            raise PaymentGatewayException(detail=f"Failed to capture payment via gateway: {gateway_res.get('message', 'Unknown error')}")

    async def refund_transaction(self, db: AsyncSession, transaction: Transaction) -> Transaction:
        """
        Refunds a captured transaction.
        """
        if transaction.status not in [TransactionStatus.CAPTURED, TransactionStatus.PARTIALLY_REFUNDED]:
            raise APIException(status_code=400, detail="Only 'CAPTURED' or 'PARTIALLY_REFUNDED' transactions can be refunded.")
        
        # Implement logic for full vs partial refund here if needed
        refund_amount = transaction.amount # For simplicity, full refund

        # Simulate interaction with payment gateway to refund
        gateway_res = await self.payment_gateway.refund_payment(
            transaction.gateway_transaction_id, refund_amount, transaction.currency
        )

        if gateway_res.get("success"):
            new_status = TransactionStatus.REFUNDED # Assume full refund for now
            updated_transaction = await self.update_transaction_status(
                db, transaction.id, new_status,
                gateway_response=gateway_res
            )
            return updated_transaction
        else:
            # Optionally update status to FAILED_REFUND
            raise PaymentGatewayException(detail=f"Failed to refund payment via gateway: {gateway_res.get('message', 'Unknown error')}")

```

#### `payment_processor/app/services/payment_gateway.py` (Mocked External Service)
```python