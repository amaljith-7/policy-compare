from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsurerViewSet

router = DefaultRouter()
router.register(r'insurers', InsurerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
