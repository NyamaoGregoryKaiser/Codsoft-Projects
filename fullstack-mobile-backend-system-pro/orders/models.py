from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

class Order(models.Model):
    """
    Model for customer orders.
    """
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('shipped', _('Shipped')),
        ('delivered', _('Delivered')),
        ('cancelled', _('Cancelled')),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.CASCADE, verbose_name=_("Customer"))
    order_date = models.DateTimeField(auto_now_add=True, verbose_name=_("Order Date"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name=_("Order Status"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name=_("Total Amount"))
    shipping_address = models.TextField(verbose_name=_("Shipping Address"))
    payment_method = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Payment Method"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['user', 'order_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Order {self.id} by {self.user.email}"

    def calculate_total_amount(self):
        """Calculates the total amount of the order based on its items."""
        total = sum(item.get_total_price() for item in self.items.all())
        if self.total_amount != total:
            self.total_amount = total
            self.save()
        return self.total_amount

class OrderItem(models.Model):
    """
    Model for individual items within an order.
    """
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE, verbose_name=_("Order"))
    product = models.ForeignKey('products.Product', related_name='order_items', on_delete=models.SET_NULL, null=True, verbose_name=_("Product"))
    quantity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name=_("Quantity"))
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Price at Order")) # Price when order was placed

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")
        unique_together = ('order', 'product') # A product can only appear once in an order
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'N/A'} in Order {self.order.id}"

    def get_total_price(self):
        """Calculates the total price for this order item."""
        return self.quantity * self.price_at_order
--- END FILE ---

---