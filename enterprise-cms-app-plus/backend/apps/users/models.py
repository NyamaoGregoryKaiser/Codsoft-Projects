```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    This allows for easy expansion of user profiles in the future
    without requiring migrations if you start with AbstractUser.
    """
    # Additional fields can be added here
    # e.g., avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    # e.g., bio = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.username
```