from rest_framework import serializers
from orders.models import Order, OrderItem
from products.models import Product # Import Product model to check stock
from users.serializers import UserProfileSerializer # To display user details in order

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, source='get_total_price')

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_image', 'quantity', 'price_at_order', 'total_price')
        read_only_fields = ('price_at_order',) # Price set at creation, not editable
        extra_kwargs = {
            'product': {'write_only': True} # Hide product ID when reading, show product name
        }

    def validate(self, data):
        if not self.instance: # Only validate for creation
            product = data.get('product')
            quantity = data.get('quantity')

            if product and quantity:
                if quantity <= 0:
                    raise serializers.ValidationError("Quantity must be at least 1.")

                try:
                    product_instance = Product.objects.get(id=product.id)
                except Product.DoesNotExist:
                    raise serializers.ValidationError({"product": "Product not found."})

                if not product_instance.is_active:
                    raise serializers.ValidationError({"product": "This product is not active."})

                if product_instance.stock < quantity:
                    raise serializers.ValidationError({"quantity": f"Only {product_instance.stock} units of {product_instance.name} are available in stock."})

                data['price_at_order'] = product_instance.price # Capture current price
        return data

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = UserProfileSerializer(read_only=True) # Read-only for displaying user details
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    order_id = serializers.ReadOnlyField(source='id') # Alias for clarity

    class Meta:
        model = Order
        fields = ('order_id', 'user', 'order_date', 'status', 'total_amount', 'shipping_address', 'payment_method', 'items', 'created_at', 'updated_at')
        read_only_fields = ('user', 'order_date', 'status', 'total_amount', 'created_at', 'updated_at') # Status updated via specific action

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        shipping_address = validated_data.get('shipping_address')

        if not shipping_address and user.address: # Use user's default address if not provided
            validated_data['shipping_address'] = user.address
        elif not shipping_address:
            raise serializers.ValidationError({"shipping_address": "Shipping address is required."})

        # Create order first
        order = Order.objects.create(user=user, **validated_data)

        # Process order items and update product stock
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']

            # Reduce product stock
            product.reduce_stock(quantity) # This method also saves the product instance

            OrderItem.objects.create(order=order, **item_data)

        # Calculate and save total amount for the order
        order.calculate_total_amount()

        return order

    def update(self, instance, validated_data):
        # We generally don't allow modifying order items via a direct update on the order endpoint
        # Items are processed during creation. Status can be updated via a separate action.
        # This update method only handles fields like shipping_address or payment_method if needed
        # For simplicity, we make read-only for items here, and handle status update separately.

        # Example of allowing shipping address update
        instance.shipping_address = validated_data.get('shipping_address', instance.shipping_address)
        instance.payment_method = validated_data.get('payment_method', instance.payment_method)
        # instance.status = validated_data.get('status', instance.status) # Disallow direct status change here

        instance.save()
        return instance
--- END FILE ---

---