from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

class Category(models.Model):
    """
    Model for product categories.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Category Name"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    slug = models.SlugField(max_length=100, unique=True, help_text=_("A short label for URL"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.name

class Product(models.Model):
    """
    Model for individual products.
    Includes inventory management.
    """
    name = models.CharField(max_length=255, verbose_name=_("Product Name"))
    description = models.TextField(verbose_name=_("Product Description"))
    category = models.ForeignKey(Category, related_name='products', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("Category"))
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], verbose_name=_("Price"))
    stock = models.IntegerField(validators=[MinValueValidator(0)], default=0, verbose_name=_("Stock Quantity"))
    image = models.ImageField(upload_to='product_images/', blank=True, null=True, verbose_name=_("Product Image"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    @property
    def is_in_stock(self):
        return self.stock > 0

    def reduce_stock(self, quantity):
        if self.stock < quantity:
            raise ValueError("Not enough stock for this product.")
        self.stock -= quantity
        self.save()
        return self.stock

    def add_stock(self, quantity):
        if quantity < 0:
            raise ValueError("Quantity to add must be positive.")
        self.stock += quantity
        self.save()
        return self.stock
--- END FILE ---

---