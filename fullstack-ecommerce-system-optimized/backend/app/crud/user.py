```python
from typing import Any, Dict, Optional, Union

from sqlalchemy.orm import Session

from app.core import security
from app.crud.base import CRUDBase
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=security.get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            is_active=True,
            is_superuser=False,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"User created: {db_obj.email}")
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = security.get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        # Prevent non-superusers from setting superuser status if not explicitly handled
        # (This CRUD method is typically used by superusers for other users, or user themselves for their profile)
        if 'is_superuser' in update_data and not db_obj.is_superuser: # Assuming db_obj is the user being updated
            logger.warning(f"Attempted to set superuser status for user {db_obj.email} via update without proper authorization check.")
            del update_data['is_superuser'] # Or raise an error

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(
        self, db: Session, *, email: str, password: str
    ) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not security.verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser


crud_user = CRUDUser(User)

```