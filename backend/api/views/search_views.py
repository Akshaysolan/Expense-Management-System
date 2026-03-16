from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from api.models.base import Employee
from api.models.expense import Expense
from api.models.trip import Trip
from api.serializers.expense import ExpenseSerializer
from api.serializers.trip import TripSerializer
# Fix import - import from the correct serializer file
from api.serializers.employee import EmployeeSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search(request):
    """Global search across expenses, trips, and employees"""
    query = request.query_params.get('q', '')
    
    if len(query) < 2:
        return Response({'error': 'Search query too short'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    results = {
        'expenses': [],
        'trips': [],
        'employees': []
    }
    
    if employee.role == 'admin':
        expenses = Expense.objects.filter(
            Q(subject__icontains=query) | 
            Q(description__icontains=query) |
            Q(employee__user__first_name__icontains=query) |
            Q(employee__user__last_name__icontains=query)
        )[:10]
    elif employee.role == 'manager' and employee.team:
        expenses = Expense.objects.filter(
            team=employee.team
        ).filter(
            Q(subject__icontains=query) | 
            Q(description__icontains=query) |
            Q(employee__user__first_name__icontains=query) |
            Q(employee__user__last_name__icontains=query)
        )[:10]
    else:
        expenses = Expense.objects.filter(
            employee=employee
        ).filter(
            Q(subject__icontains=query) | 
            Q(description__icontains=query)
        )[:10]
    
    results['expenses'] = ExpenseSerializer(expenses, many=True).data
    
    if employee.role == 'admin':
        trips = Trip.objects.filter(
            Q(destination__icontains=query) | 
            Q(purpose__icontains=query) |
            Q(employee__user__first_name__icontains=query) |
            Q(employee__user__last_name__icontains=query)
        )[:10]
    elif employee.role == 'manager' and employee.team:
        trips = Trip.objects.filter(
            employee__team=employee.team
        ).filter(
            Q(destination__icontains=query) | 
            Q(purpose__icontains=query) |
            Q(employee__user__first_name__icontains=query) |
            Q(employee__user__last_name__icontains=query)
        )[:10]
    else:
        trips = Trip.objects.filter(
            employee=employee
        ).filter(
            Q(destination__icontains=query) | 
            Q(purpose__icontains=query)
        )[:10]
    
    results['trips'] = TripSerializer(trips, many=True).data
    
    if employee.role in ['admin', 'manager']:
        employees_qs = Employee.objects.filter(is_active=True)
        
        if employee.role == 'manager' and employee.team:
            employees_qs = employees_qs.filter(team=employee.team)
        
        employees = employees_qs.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(employee_id__icontains=query) |
            Q(department__icontains=query)
        )[:10]
        
        results['employees'] = EmployeeSerializer(employees, many=True).data
    
    return Response(results)