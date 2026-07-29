# notifications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatrixViewSet, fire_trigger, test_send_cell

router = DefaultRouter()
router.register(r'matrix', MatrixViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('fire-trigger/', fire_trigger, name='fire_trigger'),
    path('test-send/', test_send_cell, name='test_send_cell'),
]