from django.contrib import admin
from .models import User, Role

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'role', 'is_active', 'created_at']
    list_filter = ['is_active', 'role']
    search_fields = ['email', 'full_name']

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_default', 'created_at']
