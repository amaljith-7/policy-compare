from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet, ExtractView, ShareView, DashboardView

router = DefaultRouter()
router.register(r'quotes', QuoteViewSet)

urlpatterns = [
    path('quotes/extract/', ExtractView.as_view(), name='quote-extract'),
    path('quotes/<uuid:pk>/share/', ShareView.as_view(), name='quote-share'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]
