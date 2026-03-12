from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Insurer
from .serializers import InsurerSerializer
from core.permissions import permission_required


class InsurerViewSet(viewsets.ModelViewSet):
    queryset = Insurer.objects.all()
    serializer_class = InsurerSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), permission_required('insurers.manage')()]

    def get_queryset(self):
        qs = super().get_queryset()
        enabled = self.request.query_params.get('enabled')
        if enabled is not None:
            qs = qs.filter(is_enabled=enabled.lower() == 'true')
        return qs.order_by('name')
