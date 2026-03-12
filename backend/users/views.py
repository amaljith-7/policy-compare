from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import User, Role
from core.serializers import UserSerializer, UserCreateSerializer, RoleSerializer
from core.permissions import permission_required
from .serializers import RoleCreateSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('role').all()
    permission_classes = [IsAuthenticated, permission_required('users.manage')]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    permission_classes = [IsAuthenticated, permission_required('roles.manage')]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RoleCreateSerializer
        return RoleSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('name')
