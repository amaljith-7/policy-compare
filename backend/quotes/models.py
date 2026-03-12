import uuid
from django.db import models
from django.conf import settings


class Quote(models.Model):
    class Status(models.TextChoices):
        NEW = 'NEW', 'New'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        IN_DISCUSSION = 'IN_DISCUSSION', 'In Discussion'
        HOLD = 'HOLD', 'Hold'
        CLOSED_WON = 'CLOSED_WON', 'Closed Won'
        CLOSED_LOST = 'CLOSED_LOST', 'Closed Lost'

    class ProductType(models.TextChoices):
        MOTOR = 'MOTOR', 'Motor Insurance'
        BUSINESS = 'BUSINESS', 'Business Insurance'
        HEALTH = 'HEALTH', 'Health Insurance'
        LIFE = 'LIFE', 'Life Insurance'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote_number = models.PositiveIntegerField(unique=True, editable=False)
    customer_name = models.CharField(max_length=255)
    product_type = models.CharField(max_length=20, choices=ProductType.choices)
    insurers = models.ManyToManyField('insurers.Insurer', related_name='quotes', blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quotes')
    notes = models.TextField(blank=True, default='')
    comparison_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'QT-{self.quote_number:03d} - {self.customer_name}'

    @property
    def quote_no(self):
        return f'QT-{self.quote_number:03d}'

    def save(self, *args, **kwargs):
        if not self.quote_number:
            from django.db.models import Max
            max_num = Quote.objects.select_for_update().aggregate(Max('quote_number'))['quote_number__max']
            self.quote_number = (max_num or 0) + 1
        super().save(*args, **kwargs)
