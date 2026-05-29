import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import F

from orders.models import Order, OrderItem
from orders.serializers import OrderSerializer, OrderItemSerializer
from core.permissions import IsOwnerOrReadOnly, IsAdminUserOrReadOnly # Ensure these are imported

logger = logging.getLogger('app_logger')

class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows orders to be viewed or created.
    Authenticated users can view/create their own orders.
    Admin users can view/update/delete any order.
    """
    queryset = Order.objects.select_related('user').prefetch_related('items__product').all().order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly] # Allow owner to read/update, admin to do anything

    filter_backends = [DjangoFilterBackend, ]
    filterset_fields = ['status', 'order_date']

    def get_queryset(self):
        """
        Admins can see all orders. Regular users can only see their own orders.
        """
        if self.request.user.is_staff or self.request.user.is_superuser:
            return super().get_queryset()
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Override perform_create to handle transaction and stock management.
        """
        with transaction.atomic():
            order = serializer.save(user=self.request.user)
            logger.info(f"Order {order.id} created by user {self.request.user.email}")
            return order

    def create(self, request, *args, **kwargs):
        # The serializer.is_valid() call will run validations for Order and OrderItem
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            instance = self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating order for user {request.user.email}: {e}", exc_info=True)
            return Response({'detail': f'Error creating order: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUserOrReadOnly])
    def update_status(self, request, pk=None):
        """
        Admin action to update the status of an order.
        """
        order = self.get_object()
        new_status = request.data.get('status')

        if not new_status or new_status not in dict(order.STATUS_CHOICES):
            return Response({'detail': 'Invalid or missing status.'}, status=status.HTTP_400_BAD_REQUEST)

        previous_status = order.status
        order.status = new_status
        order.save(update_fields=['status'])
        logger.info(f"Order {order.id} status changed from '{previous_status}' to '{new_status}' by {self.request.user.email}")

        # If order is cancelled, potentially return stock
        if new_status == 'cancelled' and previous_status != 'cancelled':
            self._handle_cancelled_order(order)

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _handle_cancelled_order(self, order):
        """
        Helper method to return stock to products if an order is cancelled.
        This should be carefully considered based on business logic (e.g., only if not shipped).
        """
        try:
            with transaction.atomic():
                for item in order.items.all():
                    if item.product:
                        item.product.add_stock(item.quantity)
                        logger.info(f"Returned {item.quantity} stock for product '{item.product.name}' due to order {order.id} cancellation.")
            logger.info(f"Stock returned for all items in cancelled Order {order.id}.")
        except Exception as e:
            logger.error(f"Failed to return stock for cancelled order {order.id}: {e}", exc_info=True)
            # Potentially trigger an alert or manual review for stock discrepancy

    def perform_destroy(self, instance):
        order_id = instance.id
        user_email = instance.user.email
        # Optional: Prevent deletion of non-pending orders or trigger stock return
        if instance.status != 'pending' and instance.status != 'cancelled':
            raise status.HTTP_400_BAD_REQUEST("Only pending or cancelled orders can be deleted directly.")
        
        # If order is pending, return stock before deletion
        if instance.status == 'pending':
            self._handle_cancelled_order(instance) # Use the same logic for returning stock

        instance.delete()
        logger.warning(f"Order {order_id} (by {user_email}) deleted by admin {self.request.user.email}.")

class OrderItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows order items to be viewed.
    Read-only, as items are managed through the Order creation.
    Admin users can view all items, regular users can view items from their orders.
    """
    queryset = OrderItem.objects.select_related('order', 'product').all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        Admins can see all order items. Regular users can only see items from their own orders.
        """
        if self.request.user.is_staff or self.request.user.is_superuser:
            return super().get_queryset()
        return super().get_queryset().filter(order__user=self.request.user)
--- END FILE ---

---