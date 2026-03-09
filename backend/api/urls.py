# backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('dashboard/', views.get_dashboard_data, name='dashboard'),
    path('expenses/', views.get_expenses, name='expenses'),
    path('upload-pdf/', views.upload_pdf, name='upload_pdf'),
    path('add-expense/', views.add_expense, name='add_expense'),
]