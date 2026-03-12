from rest_framework import serializers
from core.models import Role


class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions', 'is_default']
        read_only_fields = ['id']
