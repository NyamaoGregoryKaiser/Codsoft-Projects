import asyncio
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database.engine import async_engine
from app.database.models import User, Merchant, Customer, PaymentMethod, Transaction, UserRole, TransactionStatus, PaymentMethodType
from app.core.security import get_password_hash
from app.core.config import settings
from app.crud.user import crud_user
from app.crud.merchant import crud_merchant
from app.crud.customer import crud_customer
from app.crud.payment_method import crud_payment_method
from app.crud.transaction import crud_transaction
from app.core.logger import get_logger

logger = get_logger(__name__)

AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def create_superuser(db: AsyncSession) -> User:
    user = await crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        logger.info("Creating superuser...")
        user_in = {
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
            "is_superuser": True,
            "is_active": True,
            "full_name": "Admin User",
            "role": UserRole.ADMIN
        }
        user = await crud_user.create(db, obj_in=user_in)
        logger.info(f"Superuser '{user.email}' created.")
    else:
        logger.info(f"Superuser '{user.email}' already exists.")
    return user

async def create_example_merchant(db: AsyncSession, admin_user_id: UUID) -> Merchant:
    user_email = "merchant1@example.com"
    user = await crud_user.get_by_email(db, email=user_email)
    if not user:
        logger.info("Creating example merchant user...")
        user_in = {
            "email": user_email,
            "password": "merchant_password",
            "is_superuser": False,
            "is_active": True,
            "full_name": "Example Merchant User",
            "role": UserRole.MERCHANT
        }
        user = await crud_user.create(db, obj_in=user_in)
        logger.info(f"Merchant user '{user.email}' created.")

    merchant = await crud_merchant.get_by_user_id(db, user.id)
    if not merchant:
        logger.info("Creating example merchant profile...")
        merchant_in = {
            "user_id": user.id,
            "name": "Acme Corp.",
            "api_key_hash": get_password_hash("acme_secret_api_key"),
            "webhook_url": "http://localhost:8000/api/v1/webhooks/external-merchant-webhook", # Example webhook URL
            "is_active": True
        }
        merchant = await crud_merchant.create(db, obj_in=merchant_in)
        logger.info(f"Merchant '{merchant.name}' created for user '{user.email}'.")
    else:
        logger.info(f"Merchant '{merchant.name}' already exists for user '{user.email}'.")
    return merchant

async def create_example_customer_and_payment_method(db: AsyncSession, merchant: Merchant) -> tuple[Customer, PaymentMethod]:
    customer_email = "customer1@example.com"
    customer = await crud_customer.get_by_email_for_merchant(db, merchant_id=merchant.id, email=customer_email)
    
    if not customer:
        logger.info(f"Creating example customer '{customer_email}' for merchant '{merchant.name}'...")
        customer_in = {
            "merchant_id": merchant.id,
            "external_id": "cust_001",
            "first_name": "John",
            "last_name": "Doe",
            "email": customer_email,
            "phone_number": "+15551234567"
        }
        customer = await crud_customer.create(db, obj_in=customer_in)
        logger.info(f"Customer '{customer.email}' created.")
    else:
        logger.info(f"Customer '{customer.email}' already exists.")

    payment_method = await crud_payment_method.get_by_customer_and_token(db, customer_id=customer.id, token="tok_visa_4242_1234")
    if not payment_method:
        logger.info(f"Creating example payment method for customer '{customer.email}'...")
        payment_method_in = {
            "customer_id": customer.id,
            "type": PaymentMethodType.card,
            "token": "tok_visa_4242_1234", # Mock token
            "last4": "4242",
            "brand": "Visa",
            "expiry_month": 12,
            "expiry_year": 2025,
            "is_default": True
        }
        payment_method = await crud_payment_method.create(db, obj_in=payment_method_in)
        logger.info(f"Payment method '{payment_method.id}' created for customer '{customer.email}'.")
    else:
        logger.info(f"Payment method '{payment_method.id}' already exists for customer '{customer.email}'.")
    return customer, payment_method

async def create_example_transactions(db: AsyncSession, merchant: Merchant, customer: Customer, payment_method: PaymentMethod):
    # Example 1: Captured transaction
    if not await crud_transaction.get_by_merchant_and_description(db, merchant.id, "Demo Captured Payment"):
        logger.info("Creating example CAPTURED transaction...")
        transaction_in = {
            "merchant_id": merchant.id,
            "customer_id": customer.id,
            "payment_method_id": payment_method.id,
            "amount": Decimal("100.00"),
            "currency": "USD",
            "status": TransactionStatus.CAPTURED,
            "description": "Demo Captured Payment",
            "gateway_transaction_id": "gtw_charge_demo1",
            "gateway_response": {"status": "success", "message": "Demo captured"},
            "metadata": {"order_id": "ORDER_ABC_123"}
        }
        await crud_transaction.create(db, obj_in=transaction_in)
        logger.info("CAPTURED transaction created.")
    else:
        logger.info("CAPTURED transaction already exists.")

    # Example 2: Pending transaction
    if not await crud_transaction.get_by_merchant_and_description(db, merchant.id, "Demo Pending Payment"):
        logger.info("Creating example PENDING transaction...")
        transaction_in = {
            "merchant_id": merchant.id,
            "customer_id": customer.id,
            "payment_method_id": payment_method.id,
            "amount": Decimal("50.00"),
            "currency": "USD",
            "status": TransactionStatus.PENDING,
            "description": "Demo Pending Payment",
            "metadata": {"order_id": "ORDER_XYZ_456"}
        }
        await crud_transaction.create(db, obj_in=transaction_in)
        logger.info("PENDING transaction created.")
    else:
        logger.info("PENDING transaction already exists.")

async def main():
    logger.info("Starting seed data script...")
    async with AsyncSessionLocal() as db:
        admin_user = await create_superuser(db)
        await db.commit() # Commit admin user creation

        merchant = await create_example_merchant(db, admin_user.id)
        await db.commit() # Commit merchant creation

        customer, payment_method = await create_example_customer_and_payment_method(db, merchant)
        await db.commit() # Commit customer and payment method creation

        await create_example_transactions(db, merchant, customer, payment_method)
        await db.commit() # Commit transactions creation
    logger.info("Seed data script finished.")

if __name__ == "__main__":
    asyncio.run(main())

```
*(Query optimization involves using `selectinload` for relationships, adding indexes as defined in models, and ensuring efficient filtering in CRUD operations.)*

---

### 3. Configuration & Setup

#### `payment_processor/requirements.txt`
```