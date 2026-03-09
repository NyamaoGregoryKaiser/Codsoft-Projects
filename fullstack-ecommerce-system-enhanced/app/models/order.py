```python
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False)
    status = Column(String, default="pending", server_default="pending", nullable=False) # e.g., pending, processing, shipped, delivered, cancelled
    total_amount = Column(Numeric(precision=10, scale=2), nullable=False)
    shipping_address = Column(String, nullable=True)
    payment_status = Column(String, default="pending", server_default="pending", nullable=False) # e.g., pending, paid, refunded
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="orders", lazy="selectin")
    order_items = relationship("OrderItem", back_populates="order", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status='{self.status}', total={self.total_amount})>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Numeric(precision=10, scale=2), nullable=False) # Price at the time of order

    # Relationships
    order = relationship("Order", back_populates="order_items", lazy="noload")
    product = relationship("Product", back_populates="order_items", lazy="selectin")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity})>"


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now(), nullable=False)

    # Ensure a user can only have one of each product in their cart
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_cart_item_user_product"),)

    # Relationships
    user = relationship("User", back_populates="cart_items", lazy="noload")
    product = relationship("Product", back_populates="cart_items", lazy="selectin")

    def __repr__(self):
        return f"<CartItem(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, quantity={self.quantity})>"

```