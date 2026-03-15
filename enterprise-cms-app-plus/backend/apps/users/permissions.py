```python
from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit/create objects.
    Read-only access is allowed for everyone.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users.
        return request.user and request.user.is_staff

class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of an object to edit it.
    Read-only access is allowed for everyone.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author of the post.
        # Check if the user is the author or an admin.
        return obj.author == request.user or request.user.is_staff

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object (e.g., MediaItem) to view/edit/delete it,
    or allow admin users full access.
    """
    def has_object_permission(self, request, view, obj):
        # Owners can view, edit, or delete their objects.
        if obj.owner == request.user:
            return True

        # Admins can view, edit, or delete any object.
        if request.user and request.user.is_staff:
            return True
        
        return False
```