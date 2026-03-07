```python
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, DECIMAL, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
from app.core.constants import UserRole, TransactionStatus, PaymentMethodType
import uuid

class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    email: str = Column(String, unique=True, index=True, nullable=False)
    hashed_password: str = Column(String, nullable=False)
    role: UserRole = Column(String, default=UserRole.MERCHANT, nullable=False)
    is_active: bool = Column(Boolean, default=True)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="user", uselist=False)

class Merchant(Base):
    __tablename__ = "merchants"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name: str = Column(String, index=True, nullable=False)
    api_key: str = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    is_active: bool = Column(Boolean, default=True)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="merchant")
    customers = relationship("Customer", back_populates="merchant")
    transactions = relationship("Transaction", back_populates="merchant")
    webhooks = relationship("WebhookEvent", back_populates="merchant") # Outgoing webhooks

class Customer(Base):
    __tablename__ = "customers"

    id: int = Column(Integer, primary_key=True, index=True)
    merchant_id: int = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    external_id: str = Column(String, index=True, nullable=False) # ID from merchant's system
    email: str = Column(String, index=True)
    name: str = Column(String)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="customers")
    payment_methods = relationship("PaymentMethod", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")

    __table_args__ = (
        # Ensure a customer external ID is unique per merchant
        func.UniqueConstraint("merchant_id", "external_id", name="uq_merchant_customer_external_id"),
    )

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: int = Column(Integer, primary_key=True, index=True)
    customer_id: int = Column(Integer, ForeignKey("customers.id"), nullable=False)
    type: PaymentMethodType = Column(String, nullable=False)
    token: str = Column(String, unique=True, index=True, nullable=False) # Token from external gateway
    last4: str = Column(String(4)) # Last 4 digits of card
    brand: str = Column(String) # e.g., Visa, Mastercard
    expiry_month: int = Column(Integer)
    expiry_year: int = Column(Integer)
    is_default: bool = Column(Boolean, default=False)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="payment_methods")

class Transaction(Base):
    __tablename__ = "transactions"

    id: int = Column(Integer, primary_key=True, index=True)
    uuid: str = Column(String, unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4())) # Unique ID for idempotent requests
    merchant_id: int = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    customer_id: int = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_method_id: int = Column(Integer, ForeignKey("payment_methods.id"), nullable=False)
    amount: DECIMAL = Column(DECIMAL(10, 2), nullable=False) # e.g., 100.00
    currency: str = Column(String(3), nullable=False) # e.g., USD, EUR
    status: TransactionStatus = Column(String, default=TransactionStatus.PENDING, nullable=False)
    description: str = Column(Text)
    external_transaction_id: str = Column(String, index=True) # ID from external payment gateway
    gateway_response: dict = Column(JSON) # Store raw gateway response (structured JSON)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    payment_method = relationship("PaymentMethod") # One-way relationship as payment method can exist without transaction relation

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: int = Column(Integer, primary_key=True, index=True)
    merchant_id: int = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    event_type: str = Column(String, nullable=False) # e.g., transaction.succeeded, transaction.failed
    payload: dict = Column(JSON, nullable=False)
    status: str = Column(String, default="pending", nullable=False) # pending, sent, failed
    retries: int = Column(Integer, default=0)
    last_attempt_at: DateTime = Column(DateTime(timezone=True))
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: DateTime = Column(DateTime(timezone=True), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="webhooks")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable if system event
    merchant_id: int = Column(Integer, ForeignKey("merchants.id"), nullable=True) # Applicable to merchant actions
    action: str = Column(String, nullable=False) # e.g., "user_login", "transaction_capture"
    entity_type: str = Column(String) # e.g., "Transaction", "User"
    entity_id: str = Column(String) # ID of the affected entity
    details: dict = Column(JSON) # Additional details (e.g., old_value, new_value)
    ip_address: str = Column(String)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    merchant = relationship("Merchant")
```