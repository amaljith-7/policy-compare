from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions', 'is_default', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'role_id', 'is_active', 'is_superuser', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'password', 'role_id', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        if role_id:
            user.role_id = role_id
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }
