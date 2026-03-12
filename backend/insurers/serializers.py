from rest_framework import serializers
from .models import Insurer


class InsurerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurer
        fields = ['id', 'name', 'logo', 'is_enabled', 'created_at']
        read_only_fields = ['id', 'created_at']
