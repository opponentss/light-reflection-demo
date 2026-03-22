from django.urls import path
from . import views

urlpatterns = [
    path('', views.light_reflection_view, name='light_reflection'),
]