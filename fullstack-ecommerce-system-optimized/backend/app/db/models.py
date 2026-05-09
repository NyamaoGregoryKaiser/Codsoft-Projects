```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="owner")
    cart: Mapped[Optional["Cart"]] = relationship("Cart", back_populates="user", uselist=False)
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id"))

    owner: Mapped["User"] = relationship("User", back_populates="products")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="product")


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="cart")
    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    @property
    def total_items(self) -> int:
        return sum(item.quantity for item in self.items)

    @property
    def total_amount(self) -> float:
        return sum(item.quantity * item.product.price for item in self.items)


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cart_id: Mapped[int] = mapped_column(Integer, ForeignKey("carts.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # e.g., pending, processing, shipped, delivered, cancelled
    shipping_address: Mapped[Optional[str]] = mapped_column(Text)
    payment_status: Mapped[str] = mapped_column(String(50), default="unpaid", nullable=False) # e.g., unpaid, paid, refunded

    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order: Mapped[float] = mapped_column(Float, nullable=False) # Price at the time of order
    
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5 stars
    comment: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    product: Mapped["Product"] = relationship("Product", back_populates="reviews")

    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='_user_product_uc'), # Ensure one review per user per product
    )
```

**Note on Alembic:**
Alembic setup involves:
1.  `alembic init -t async migrations` (or `generic` if not using async DB drivers yet)
2.  Edit `alembic.ini` to point to your `env.py` and specify `sqlalchemy.url`.
3.  Edit `env.py` to import your `Base` from `app.db.base` and target metadata.
4.  Run `alembic revision --autogenerate -m "Initial migration"`
5.  Run `alembic upgrade head`

Since Alembic setup is interactive and requires specific paths, I'll provide the `env.py` content that would typically be in `backend/alembic/env.py`. `alembic.ini` is a standard file and would be in `backend/alembic.ini`.