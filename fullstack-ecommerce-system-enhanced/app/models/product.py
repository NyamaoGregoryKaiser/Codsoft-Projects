```python
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    products = relationship("Product", back_populates="category", lazy="noload") # Products belonging to this category

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(precision=10, scale=2), nullable=False) # e.g., 12345678.99
    stock_quantity = Column(Integer, default=0, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True, server_default="true", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now(), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products", lazy="selectin") # Eager load category when loading product
    order_items = relationship("OrderItem", back_populates="product", lazy="noload") # Order items containing this product
    cart_items = relationship("CartItem", back_populates="product", lazy="noload") # Cart items containing this product

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"

```