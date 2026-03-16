from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from api.models.base import Employee
from api.models.expense import Expense
from api.serializers.expense import ExpenseSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list(request):
    """List all expenses or create new expense"""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        status_filter = request.query_params.get('status', None)
        team_filter = request.query_params.get('team', None)
        employee_filter = request.query_params.get('employee', None)
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        if employee.role == 'admin':
            expenses = Expense.objects.all()
        elif employee.role == 'manager' and employee.team:
            expenses = Expense.objects.filter(team=employee.team)
        else:
            expenses = Expense.objects.filter(employee=employee)
        
        expenses = expenses.order_by('-date', '-created_at')
        
        if status_filter:
            expenses = expenses.filter(status=status_filter)
        if team_filter:
            expenses = expenses.filter(team_id=team_filter)
        if employee_filter:
            expenses = expenses.filter(employee_id=employee_filter)
        if date_from:
            expenses = expenses.filter(date__gte=date_from)
        if date_to:
            expenses = expenses.filter(date__lte=date_to)
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        if 'employee' not in data:
            data['employee'] = employee.id
        
        serializer = ExpenseSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, pk):
    """Get, update or delete expense"""
    expense = get_object_or_404(Expense, pk=pk)
    
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and expense.employee != employee:
            if employee.role == 'manager' and expense.team == employee.team:
                pass
            else:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ExpenseSerializer(expense, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_stats(request):
    """Get expense statistics"""
    try:
        employee = Employee.objects.get(user=request.user)
        
        if employee.role == 'admin':
            expenses = Expense.objects.all()
        elif employee.role == 'manager' and employee.team:
            expenses = Expense.objects.filter(team=employee.team)
        else:
            expenses = Expense.objects.filter(employee=employee)
        
        status_counts = expenses.values('status').annotate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        category_stats = expenses.values('category__name', 'category__code').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        team_stats = expenses.values('team__name').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        monthly_data = []
        for i in range(5, -1, -1):
            month_start = timezone.now().date().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_total = expenses.filter(
                date__gte=month_start,
                date__lte=month_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'total': float(month_total)
            })
        
        return Response({
            'status_distribution': status_counts,
            'category_distribution': category_stats,
            'team_distribution': team_stats,
            'monthly_trends': monthly_data,
            'total_expenses': expenses.count(),
            'total_amount': float(expenses.aggregate(total=Sum('amount'))['total'] or 0)
        })
    except Exception as e:
        logger.error(f"Expense stats error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)