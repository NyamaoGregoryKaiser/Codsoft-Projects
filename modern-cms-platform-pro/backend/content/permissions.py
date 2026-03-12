from rest_framework import permissions

class IsAdminOrAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow administrators or authors of an object to edit it,
    and authenticated users to view it.
    """

    def has_permission(self, request, view):
        # Allow read-only access for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Allow write access only for staff users or specific authenticated actions
        # For creating content, only staff or "author" roles could be allowed
        # Let's say only staff can create for now. More granular roles can be added.
        return request.user.is_staff

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author of the post or an admin user.
        return obj.author == request.user or request.user.is_staff

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users (is_staff=True).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as an admin user, or is a read-only request.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

```

#### `backend/content/serializers.py`

```python