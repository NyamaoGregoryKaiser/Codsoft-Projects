import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import UUID
from decimal import Decimal

from app.core.config import settings
from app.database.models import User, Merchant, Customer, PaymentMethod, TransactionStatus
from app.core.security import get_password_hash
from app.crud.user import crud_user
from app.crud.merchant import crud_merchant
from app.crud.customer import crud_customer
from app.crud.payment_method import crud_payment_method
from app.crud.transaction import crud_transaction
from app.schemas.payment_method import PaymentMethodType

@pytest.fixture
async def setup_merchant_customer_pm(db_session):
    """Set up a merchant, customer, and payment method for transaction tests."""
    user = await crud_user.create(db_session, obj_in={"email": "testmerchant@test.com", "password": "pass", "full_name": "Test Merchant User", "is_superuser": False, "role": "merchant"})
    await db_session.commit()
    await db_session.refresh(user)

    merchant = await crud_merchant.create(db_session, obj_in={
        "user_id": user.id, "name": "Test Payments Inc.", "api_key_hash": get_password_hash("test_api_key")
    })
    await db_session.commit()
    await db_session.refresh(merchant)

    customer = await crud_customer.create(db_session, obj_in={
        "merchant_id": merchant.id, "external_id": "cust123", "email": "testcustomer@test.com"
    })
    await db_session.commit()
    await db_session.refresh(customer)

    payment_method = await crud_payment_method.create(db_session, obj_in={
        "customer_id": customer.id, "type": PaymentMethodType.card, "token": "mock_card_token_123", "last4": "1111", "brand": "Visa", "expiry_month": 12, "expiry_year": 2025
    })
    await db_session.commit()
    await db_session.refresh(payment_method)
    
    return user, merchant, customer, payment_method

@pytest.fixture
async def merchant_auth_headers_with_details(client: AsyncClient, setup_merchant_customer_pm, merchant_user_token_headers):
    """Fixture combining merchant auth headers with merchant, customer, and payment method objects."""
    user, merchant, customer, payment_method = setup_merchant_customer_pm
    return {
        "headers": merchant_user_token_headers,
        "merchant": merchant,
        "customer": customer,
        "payment_method": payment_method,
        "user": user
    }

@pytest.mark.asyncio
async def test_initiate_payment_with_existing_pm(
    client: AsyncClient, merchant_auth_headers_with_details: dict
):
    """Test initiating a payment using an existing payment method."""
    headers = merchant_auth_headers_with_details["headers"]
    merchant = merchant_auth_headers_with_details["merchant"]
    customer = merchant_auth_headers_with_details["customer"]
    payment_method = merchant_auth_headers_with_details["payment_method"]

    transaction_data = {
        "merchant_id": str(merchant.id),
        "customer_id": str(customer.id),
        "payment_method_id": str(payment_method.id),
        "amount": 10.50,
        "currency": "USD",
        "description": "Test payment with existing card",
        "metadata": {"source": "web"}
    }
    response = await client.post(f"{settings.API_V1_STR}/transactions/initiate", json=transaction_data, headers=headers)
    assert response.status_code == status.HTTP_202_ACCEPTED
    data = response.json()
    assert data["merchant_id"] == str(merchant.id)
    assert data["customer_id"] == str(customer.id)
    assert data["payment_method_id"] == str(payment_method.id)
    assert float(data["amount"]) == 10.50
    assert data["currency"] == "USD"
    assert data["status"] == TransactionStatus.PENDING # Initial status is PENDING
    assert "id" in data

@pytest.mark.asyncio
async def test_initiate_payment_with_new_card_details(
    client: AsyncClient, merchant_auth_headers_with_details: dict
):
    """Test initiating a payment by providing new card details for tokenization."""
    headers = merchant_auth_headers_with_details["headers"]
    merchant = merchant_auth_headers_with_details["merchant"]
    customer = merchant_auth_headers_with_details["customer"]

    transaction_data = {
        "merchant_id": str(merchant.id),
        "customer_id": str(customer.id),
        "amount": 25.00,
        "currency": "EUR",
        "description": "Test payment with new card",
        "card_details": {
            "card_number": "4111222233334444",
            "expiry_month": 11,
            "expiry_year": 2026,
            "cvv": "123"
        }
    }
    response = await client.post(f"{settings.API_V1_STR}/transactions/initiate", json=transaction_data, headers=headers)
    assert response.status_code == status.HTTP_202_ACCEPTED
    data = response.json()
    assert data["merchant_id"] == str(merchant.id)
    assert data["customer_id"] == str(customer.id)
    assert data["status"] == TransactionStatus.PENDING
    assert "payment_method_id" in data # A new payment method should have been created and linked

    # Verify a new payment method was created (implicitly by the service)
    # This requires looking into the DB which might be done in an integration test.
    # For API test, we trust the service to do its job.

@pytest.mark.asyncio
async def test_get_transaction_by_id(
    client: AsyncClient, db_session, merchant_auth_headers_with_details: dict
):
    """Test retrieving a transaction by its ID."""
    headers = merchant_auth_headers_with_details["headers"]
    merchant = merchant_auth_headers_with_details["merchant"]
    customer = merchant_auth_headers_with_details["customer"]
    payment_method = merchant_auth_headers_with_details["payment_method"]

    # First, create a transaction directly in DB or via API to ensure it exists
    transaction_obj_in = {
        "merchant_id": merchant.id,
        "customer_id": customer.id,
        "payment_method_id": payment_method.id,
        "amount": Decimal("50.00"),
        "currency": "GBP",
        "status": TransactionStatus.CAPTURED,
        "description": "Existing transaction for lookup"
    }
    transaction = await crud_transaction.create(db_session, obj_in=transaction_obj_in)
    await db_session.commit()
    await db_session.refresh(transaction)

    response = await client.get(f"{settings.API_V1_STR}/transactions/{transaction.id}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(transaction.id)
    assert float(data["amount"]) == 50.00
    assert data["status"] == TransactionStatus.CAPTURED

@pytest.mark.asyncio
async def test_get_transaction_not_found(
    client: AsyncClient, merchant_auth_headers_with_details: dict
):
    """Test retrieving a non-existent transaction."""
    headers = merchant_auth_headers_with_details["headers"]
    non_existent_id = UUID("00000000-0000-4000-8000-000000000001")
    response = await client.get(f"{settings.API_V1_STR}/transactions/{non_existent_id}", headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Transaction not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_transaction_permission_denied(
    client: AsyncClient, db_session, merchant_auth_headers_with_details: dict, create_user, create_merchant
):
    """Test that a merchant cannot view another merchant's transaction."""
    _, other_merchant, other_customer, other_payment_method = await setup_merchant_customer_pm(db_session)
    transaction_obj_in = {
        "merchant_id": other_merchant.id,
        "customer_id": other_customer.id,
        "payment_method_id": other_payment_method.id,
        "amount": Decimal("10.00"),
        "currency": "USD",
        "status": TransactionStatus.CAPTURED,
        "description": "Other merchant's transaction"
    }
    other_transaction = await crud_transaction.create(db_session, obj_in=transaction_obj_in)
    await db_session.commit()
    await db_session.refresh(other_transaction)

    # Use headers from the original merchant_auth_headers_with_details
    headers = merchant_auth_headers_with_details["headers"]
    response = await client.get(f"{settings.API_V1_STR}/transactions/{other_transaction.id}", headers=headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "permission to view this transaction" in response.json()["detail"]

@pytest.mark.asyncio
async def test_capture_authorized_transaction(
    client: AsyncClient, db_session, merchant_auth_headers_with_details: dict
):
    """Test capturing an authorized transaction."""
    headers = merchant_auth_headers_with_details["headers"]
    merchant = merchant_auth_headers_with_details["merchant"]
    customer = merchant_auth_headers_with_details["customer"]
    payment_method = merchant_auth_headers_with_details["payment_method"]

    # Create an AUTHORIZED transaction
    transaction_obj_in = {
        "merchant_id": merchant.id,
        "customer_id": customer.id,
        "payment_method_id": payment_method.id,
        "amount": Decimal("75.00"),
        "currency": "USD",
        "status": TransactionStatus.AUTHORIZED,
        "description": "Transaction to be captured",
        "gateway_transaction_id": "gtw_auth_12345" # Mock gateway ID
    }
    transaction = await crud_transaction.create(db_session, obj_in=transaction_obj_in)
    await db_session.commit()
    await db_session.refresh(transaction)

    response = await client.post(f"{settings.API_V1_STR}/transactions/{transaction.id}/capture", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(transaction.id)
    assert data["status"] == TransactionStatus.CAPTURED
    assert "gateway_response" in data # Should include gateway response

@pytest.mark.asyncio
async def test_refund_captured_transaction(
    client: AsyncClient, db_session, merchant_auth_headers_with_details: dict
):
    """Test refunding a captured transaction."""
    headers = merchant_auth_headers_with_details["headers"]
    merchant = merchant_auth_headers_with_details["merchant"]
    customer = merchant_auth_headers_with_details["customer"]
    payment_method = merchant_auth_headers_with_details["payment_method"]

    # Create a CAPTURED transaction
    transaction_obj_in = {
        "merchant_id": merchant.id,
        "customer_id": customer.id,
        "payment_method_id": payment_method.id,
        "amount": Decimal("120.00"),
        "currency": "USD",
        "status": TransactionStatus.CAPTURED,
        "description": "Transaction to be refunded",
        "gateway_transaction_id": "gtw_charge_67890" # Mock gateway ID
    }
    transaction = await crud_transaction.create(db_session, obj_in=transaction_obj_in)
    await db_session.commit()
    await db_session.refresh(transaction)

    response = await client.post(f"{settings.API_V1_STR}/transactions/{transaction.id}/refund", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(transaction.id)
    assert data["status"] == TransactionStatus.REFUNDED
    assert "gateway_response" in data

```

#### `payment_processor/locustfile.py` (Performance Test)
```python