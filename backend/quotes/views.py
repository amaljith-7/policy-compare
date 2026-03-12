import io
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count
from .models import Quote
from .serializers import QuoteListSerializer, QuoteDetailSerializer, QuoteCreateSerializer, QuoteUpdateSerializer
from .services import extract_from_pdf
from core.permissions import permission_required


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related('owned_by', 'owned_by__role').prefetch_related('insurers').all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsAuthenticated(), permission_required('quotes.create')()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), permission_required('quotes.edit')()]
        if self.action == 'destroy':
            return [IsAuthenticated(), permission_required('quotes.delete')()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return QuoteListSerializer
        if self.action == 'create':
            return QuoteCreateSerializer
        if self.action in ['update', 'partial_update']:
            return QuoteUpdateSerializer
        return QuoteDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status_filter = params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        product_type = params.get('product_type')
        if product_type:
            qs = qs.filter(product_type=product_type)

        owned_by = params.get('owned_by')
        if owned_by:
            qs = qs.filter(owned_by_id=owned_by)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(quote_number__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(owned_by=self.request.user)


class ExtractView(APIView):
    permission_classes = [IsAuthenticated, permission_required('quotes.create')]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        pdf_file = request.FILES.get('pdf')
        insurer_id = request.data.get('insurer_id')
        product_type = request.data.get('product_type', 'MOTOR')

        if not pdf_file:
            return Response({'error': 'PDF file is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not insurer_id:
            return Response({'error': 'insurer_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pdf_bytes = pdf_file.read()
            extracted_data = extract_from_pdf(pdf_bytes, product_type)
            return Response({
                'insurer_id': insurer_id,
                'fields': extracted_data,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ShareView(APIView):
    permission_classes = [IsAuthenticated, permission_required('quotes.share')]

    def post(self, request, pk):
        try:
            quote = Quote.objects.get(pk=pk)
            quote.status = Quote.Status.SUBMITTED
            quote.save()
            return Response({'status': 'shared'})
        except Quote.DoesNotExist:
            return Response({'error': 'Quote not found'}, status=status.HTTP_404_NOT_FOUND)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quotes = Quote.objects.all()
        total = quotes.count()
        by_status = dict(quotes.values_list('status').annotate(count=Count('id')).values_list('status', 'count'))
        by_product = dict(quotes.values_list('product_type').annotate(count=Count('id')).values_list('product_type', 'count'))
        recent = QuoteListSerializer(quotes[:10], many=True).data
        by_agent = list(
            quotes.values('owned_by__full_name', 'owned_by__id')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        return Response({
            'total_quotes': total,
            'by_status': by_status,
            'by_product': by_product,
            'recent_quotes': recent,
            'by_agent': by_agent,
        })
