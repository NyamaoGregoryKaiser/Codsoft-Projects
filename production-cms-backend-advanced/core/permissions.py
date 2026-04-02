from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow administrators to create, update or delete objects.
    Authenticated users can read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request, so we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users.
        return request.user and request.user.is_authenticated and request.user.is_staff

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of an object, or administrators, to edit it.
    Authenticated users can read.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author or admin.
        return (obj.author == request.user or request.user.is_staff) and request.user.is_authenticated

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object (e.g., Media) or administrators to edit/delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users can do anything.
        if request.user and request.user.is_staff:
            return True

        # The object owner can modify/delete.
        return obj.uploaded_by == request.user and request.user.is_authenticated

class IsCommentAuthorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow only the comment author or admin to update/delete.
    Public can create, authenticated can read.
    """
    def has_permission(self, request, view):
        # Allow anyone to create comments (will be approved later for anonymous)
        if view.action == 'create':
            return True
        # Allow authenticated users to list comments (or anonymous to list approved)
        if request.method in permissions.SAFE_METHODS:
            return True
        # For other actions (update/delete), require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for approved comments to everyone.
        if request.method in permissions.SAFE_METHODS:
            return obj.approved # Only allow viewing of approved comments

        # Write permissions are only allowed to the comment author or admin.
        return (obj.commenter == request.user or request.user.is_staff) and request.user.is_authenticated