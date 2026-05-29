from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds a phone number and address field.
    """
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)
    address = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ['email']
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.email or self.username

    def get_full_name(self):
        """
        Returns the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()
--- END FILE ---

---