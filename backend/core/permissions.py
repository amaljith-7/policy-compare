from rest_framework.permissions import BasePermission


class HasPermission(BasePermission):
    def __init__(self, required_permission=None):
        self.required_permission = required_permission

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if not self.required_permission:
            return True
        if not request.user.role:
            return False
        permissions = request.user.role.permissions
        if isinstance(permissions, dict):
            return permissions.get(self.required_permission, False)
        if isinstance(permissions, list):
            return self.required_permission in permissions
        return False


def permission_required(perm):
    """Factory function to create permission class with required permission."""
    class PermissionClass(HasPermission):
        def __init__(self):
            super().__init__(required_permission=perm)
    return PermissionClass
