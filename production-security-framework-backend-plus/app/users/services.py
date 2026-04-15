```python
from flask import current_app
from app.extensions import db
from app.models.user import User

class UserService:
    @staticmethod
    def get_all_users():
        """Fetches all users."""
        current_app.logger.debug("Fetching all users.")
        return User.query.all()

    @staticmethod
    def get_user_by_id(user_id):
        """Fetches a user by ID."""
        current_app.logger.debug(f"Fetching user with ID: {user_id}.")
        return db.session.get(User, user_id)

    @staticmethod
    def update_user(user, data):
        """Updates an existing user's information."""
        current_app.logger.info(f"Attempting to update user ID: {user.id} with data: {data}.")
        
        # Check for unique constraints before committing
        if 'username' in data and data['username'] != user.username and \
           User.query.filter_by(username=data['username']).first():
            current_app.logger.warning(f"Update failed for user {user.id}: Username '{data['username']}' already taken.")
            return None, "Username already taken"
        
        if 'email' in data and data['email'] != user.email and \
           User.query.filter_by(email=data['email']).first():
            current_app.logger.warning(f"Update failed for user {user.id}: Email '{data['email']}' already taken.")
            return None, "Email already taken"

        for key, value in data.items():
            if key == 'password':
                user.set_password(value)
            else:
                setattr(user, key, value)
        
        db.session.commit()
        current_app.logger.info(f"User ID: {user.id} updated successfully.")
        return user, None

    @staticmethod
    def delete_user(user):
        """Deletes a user."""
        user_id = user.id
        db.session.delete(user)
        db.session.commit()
        current_app.logger.info(f"User ID: {user_id} deleted successfully.")
        return True
```