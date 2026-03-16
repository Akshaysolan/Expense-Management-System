from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from api.models.base import Employee
from api.models.expense import Expense
from api.models.trip import Trip
# Fix imports - import from the correct serializer files
from api.serializers.employee import EmployeeSerializer
from api.serializers.expense import ExpenseSerializer
from api.serializers.trip import TripSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list(request):
    """List all employees or create new employee"""
    try:
        current_user = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        if current_user.role not in ['admin', 'manager']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        team_filter = request.query_params.get('team', None)
        department_filter = request.query_params.get('department', None)
        
        employees = Employee.objects.filter(is_active=True)
        
        if team_filter:
            employees = employees.filter(team_id=team_filter)
        if department_filter:
            employees = employees.filter(department=department_filter)
        
        if current_user.role == 'manager' and current_user.team:
            employees = employees.filter(team=current_user.team)
        
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if current_user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    """Get employee details with their expenses and trips"""
    employee = get_object_or_404(Employee, pk=pk)
    
    try:
        current_user = Employee.objects.get(user=request.user)
        if current_user.role != 'admin' and current_user != employee:
            if current_user.role == 'manager' and employee.team == current_user.team:
                pass
            else:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    expenses = Expense.objects.filter(employee=employee).order_by('-date')[:10]
    trips = Trip.objects.filter(employee=employee).order_by('-start_date')[:5]
    
    data = {
        'employee': EmployeeSerializer(employee).data,
        'recent_expenses': ExpenseSerializer(expenses, many=True).data,
        'recent_trips': TripSerializer(trips, many=True).data,
        'expense_stats': {
            'total': float(expenses.aggregate(total=Sum('amount'))['total'] or 0),
            'pending': expenses.filter(status='pending').count(),
            'approved': expenses.filter(status='approved').count()
        }
    }
    
    return Response(data)