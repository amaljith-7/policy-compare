from django.contrib import admin
from .models import Insurer

@admin.register(Insurer)
class InsurerAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_enabled', 'created_at']
