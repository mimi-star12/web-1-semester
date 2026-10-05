from django.urls import path
from . import views

urlpatterns = [
    path('requests', views.requests_list),
    path('requests/<str:student_id>', views.request_by_id),
]