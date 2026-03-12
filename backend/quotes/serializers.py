from rest_framework import serializers
from .models import Quote
from insurers.serializers import InsurerSerializer
from core.serializers import UserSerializer


class QuoteListSerializer(serializers.ModelSerializer):
    quote_no = serializers.ReadOnlyField()
    owned_by = UserSerializer(read_only=True)
    insurers = InsurerSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = ['id', 'quote_no', 'quote_number', 'customer_name', 'product_type', 'insurers', 'status', 'owned_by', 'created_at', 'updated_at']


class QuoteDetailSerializer(serializers.ModelSerializer):
    quote_no = serializers.ReadOnlyField()
    owned_by = UserSerializer(read_only=True)
    insurers = InsurerSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = ['id', 'quote_no', 'quote_number', 'customer_name', 'product_type', 'insurers', 'status', 'owned_by', 'notes', 'comparison_data', 'created_at', 'updated_at']


class QuoteCreateSerializer(serializers.ModelSerializer):
    insurer_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    class Meta:
        model = Quote
        fields = ['id', 'customer_name', 'product_type', 'insurer_ids', 'status', 'notes', 'comparison_data']
        read_only_fields = ['id']

    def create(self, validated_data):
        insurer_ids = validated_data.pop('insurer_ids', [])
        quote = Quote.objects.create(**validated_data)
        if insurer_ids:
            quote.insurers.set(insurer_ids)
        return quote


class QuoteUpdateSerializer(serializers.ModelSerializer):
    insurer_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    class Meta:
        model = Quote
        fields = ['customer_name', 'product_type', 'insurer_ids', 'status', 'notes', 'comparison_data']

    def update(self, instance, validated_data):
        insurer_ids = validated_data.pop('insurer_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if insurer_ids is not None:
            instance.insurers.set(insurer_ids)
        return instance
