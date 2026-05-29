import logging
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from products.models import Category, Product
from products.serializers import CategorySerializer, ProductSerializer
from core.permissions import IsAdminUserOrReadOnly # Assuming IsAdminUserOrReadOnly from core

logger = logging.getLogger('app_logger')

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows categories to be viewed or edited.
    Admin users can perform all actions, non-admin users can only view.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    lookup_field = 'slug' # Allow lookup by slug

    def perform_create(self, serializer):
        category = serializer.save()
        logger.info(f"Category '{category.name}' created by {self.request.user.email}")

    def perform_update(self, serializer):
        category = serializer.save()
        logger.info(f"Category '{category.name}' updated by {self.request.user.email}")

    def perform_destroy(self, instance):
        category_name = instance.name
        instance.delete()
        logger.warning(f"Category '{category_name}' deleted by {self.request.user.email}")

    # Example of caching a list view for categories
    @method_decorator(cache_page(60*5, key_prefix="category_list")) # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows products to be viewed, created, edited, or deleted.
    Admin users can perform all actions. Non-admin users can only view active products.
    """
    queryset = Product.objects.select_related('category').all().order_by('name') # Optimize with select_related
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'price']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'price', 'stock', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # For non-admin users, only show active products
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(is_active=True, stock__gt=0)
        return queryset

    def perform_create(self, serializer):
        product = serializer.save()
        logger.info(f"Product '{product.name}' created by {self.request.user.email}")
        cache.delete("product_list") # Invalidate cache on create
        cache.delete(f"product_detail_{product.id}") # Invalidate detail cache

    def perform_update(self, serializer):
        product = serializer.save()
        logger.info(f"Product '{product.name}' updated by {self.request.user.email}")
        cache.delete("product_list") # Invalidate cache on update
        cache.delete(f"product_detail_{product.id}") # Invalidate detail cache

    def perform_destroy(self, instance):
        product_name = instance.name
        product_id = instance.id
        instance.delete()
        logger.warning(f"Product '{product_name}' (ID: {product_id}) deleted by {self.request.user.email}")
        cache.delete("product_list") # Invalidate cache on delete
        cache.delete(f"product_detail_{product_id}") # Invalidate detail cache

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def add_stock(self, request, pk=None):
        """
        Admin action to add stock to a product.
        """
        product = self.get_object()
        quantity = request.data.get('quantity', 0)
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({'detail': 'Quantity must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)
            product.add_stock(quantity)
            logger.info(f"Stock added to product '{product.name}': +{quantity} by {self.request.user.email}")
            cache.delete(f"product_detail_{product.id}") # Invalidate detail cache
            return Response({'status': 'stock updated', 'new_stock': product.stock}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding stock to product {product.id}: {e}", exc_info=True)
            return Response({'detail': 'An error occurred while updating stock.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Example of caching a single product detail
    @method_decorator(cache_page(60*10, key_prefix="product_detail_")) # Cache for 10 minutes
    def retrieve(self, request, *args, **kwargs):
        # The key prefix needs to be unique per object, so we'll construct it in the middleware/view logic
        # For simplicity, here we assume cache_page handles key per-object if needed with lookup_field
        # In a real scenario, you might manually manage cache.get/cache.set in the retrieve method
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Returns a list of products with low stock (e.g., stock < 10).
        Only accessible by admin users.
        """
        if not request.user.is_staff:
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)

        low_stock_threshold = request.query_params.get('threshold', 10)
        try:
            low_stock_threshold = int(low_stock_threshold)
        except ValueError:
            return Response({'detail': 'Threshold must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        low_stock_products = self.get_queryset().filter(stock__lt=low_stock_threshold).order_by('stock')
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
--- END FILE ---

---