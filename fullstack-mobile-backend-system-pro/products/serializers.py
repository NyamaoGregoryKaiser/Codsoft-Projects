from rest_framework import serializers
from products.models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
        lookup_field = 'slug' # Enable slug lookup for category detail

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'category', 'category_name', 'price', 'stock', 'image', 'is_active', 'is_in_stock', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at', 'is_in_stock')

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be a positive value.")
        return value
--- END FILE ---

---