from django.contrib import admin
from .models import Quote

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['quote_no', 'customer_name', 'product_type', 'status', 'owned_by', 'created_at']
    list_filter = ['status', 'product_type']
    search_fields = ['customer_name']
