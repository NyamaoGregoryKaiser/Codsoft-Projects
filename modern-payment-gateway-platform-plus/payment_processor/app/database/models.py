import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Column, String, DateTime, Boolean, DECIMAL, ForeignKey, Text, JSON, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database.base import Base # Base from app/database/base.py

# --- Enums for clarity and consistency ---
class UserRole(str, Enum):
    ADMIN = "admin"
    MERCHANT = "merchant"
    CUSTOMER_PORTAL = "customer_portal" # For customers who might log in directly

class TransactionStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    VOIDED = "voided"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    DISPUTED = "disputed"
    SETTLED = "settled"

class PaymentMethodType(str, Enum):
    card = "card"
    bank_account = "bank_account"
    wallet = "wallet" # e.g., PayPal, Apple Pay

class WebhookEventType(str, Enum):
    TRANSACTION_STATUS_UPDATE = "transaction.status_update"
    REFUND_INITIATED = "refund.initiated"
    DISPUTE_OPENED = "dispute.opened"
    SETTLEMENT_BATCH = "settlement.batch"


# --- Core Models ---

class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[UserRole] = mapped_column(String, default=UserRole.MERCHANT)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant: Mapped["Merchant"] = relationship(back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User {self.email}>"

class Merchant(Base):
    __tablename__ = "merchants"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    api_key_hash: Mapped[str] = mapped_column(String, nullable=True) # For API key auth
    webhook_url: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="merchant")
    customers: Mapped[list["Customer"]] = relationship(back_populates="merchant")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="merchant")
    webhook_events: Mapped[list["WebhookEvent"]] = relationship(back_populates="merchant")

    def __repr__(self):
        return f"<Merchant {self.name}>"

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.id"), index=True, nullable=False)
    external_id: Mapped[str | None] = mapped_column(String, index=True) # Merchant's internal customer ID
    first_name: Mapped[str | None] = mapped_column(String)
    last_name: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, index=True)
    phone_number: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant: Mapped["Merchant"] = relationship(back_populates="customers")
    payment_methods: Mapped[list["PaymentMethod"]] = relationship(back_populates="customer")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="customer")

    __table_args__ = (
        UniqueConstraint('merchant_id', 'external_id', name='uq_merchant_external_customer_id'),
    )

    def __repr__(self):
        return f"<Customer {self.email or self.id}>"

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), index=True, nullable=False)
    type: Mapped[PaymentMethodType] = mapped_column(String, nullable=False)
    token: Mapped[str] = mapped_column(String, nullable=False) # Tokenized representation (e.g., Stripe token)
    last4: Mapped[str | None] = mapped_column(String(4)) # Last 4 digits of card/account
    brand: Mapped[str | None] = mapped_column(String) # e.g., Visa, Mastercard
    expiry_month: Mapped[int | None] = mapped_column(Integer)
    expiry_year: Mapped[int | None] = mapped_column(Integer)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    customer: Mapped["Customer"] = relationship(back_populates="payment_methods")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="payment_method")

    def __repr__(self):
        return f"<PaymentMethod {self.id} (last4: {self.last4})>"

class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.id"), index=True, nullable=False)
    customer_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), index=True, nullable=False)
    payment_method_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payment_methods.id"), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False) # e.g., USD, EUR
    status: Mapped[TransactionStatus] = mapped_column(String, default=TransactionStatus.PENDING, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    gateway_transaction_id: Mapped[str | None] = mapped_column(String, index=True) # ID from external payment gateway
    gateway_response: Mapped[dict | None] = mapped_column(JSON, default={}) # Raw response from gateway
    metadata: Mapped[dict | None] = mapped_column(JSON, default={}) # Custom metadata from merchant
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant: Mapped["Merchant"] = relationship(back_populates="transactions")
    customer: Mapped["Customer"] = relationship(back_populates="transactions")
    payment_method: Mapped["PaymentMethod"] = relationship(back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.id} Status: {self.status} Amount: {self.amount} {self.currency}>"

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.id"), index=True, nullable=False)
    event_type: Mapped[WebhookEventType] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False) # pending, sent, failed, retrying
    retries: Mapped[int] = mapped_column(Integer, default=0)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant: Mapped["Merchant"] = relationship(back_populates="webhook_events")

    def __repr__(self):
        return f"<WebhookEvent {self.id} Type: {self.event_type} Status: {self.status}>"

```
*(Other CRUD, Schema, and database setup files like `app/crud/base.py`, `app/database/session.py`, `app/schemas/*` would be implemented for all models following standard FastAPI/SQLAlchemy patterns.)*

---

### 2. Database Layer

#### `payment_processor/app/database/base.py`
```python