from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from api.models.base import Employee
from api.models.expense import Expense
from api.models.trip import Trip
from api.serializers.expense import ExpenseSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get all dashboard data with real-time statistics"""
    try:
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if employee.role == 'admin':
            recent_expenses = Expense.objects.all().order_by('-date', '-created_at')[:10]
        elif employee.role == 'manager':
            recent_expenses = Expense.objects.filter(team=employee.team).order_by('-date', '-created_at')[:10]
        else:
            recent_expenses = Expense.objects.filter(employee=employee).order_by('-date', '-created_at')[:10]
        
        if employee.role == 'admin':
            pending_expenses_count = Expense.objects.filter(status='pending').count()
            pending_trips_count = Trip.objects.filter(status='pending').count()
        elif employee.role == 'manager':
            pending_expenses_count = Expense.objects.filter(team=employee.team, status='pending').count()
            pending_trips_count = Trip.objects.filter(employee__team=employee.team, status='pending').count()
        else:
            pending_expenses_count = Expense.objects.filter(employee=employee, status='pending').count()
            pending_trips_count = Trip.objects.filter(employee=employee, status='pending').count()
        
        pending_tasks = [
            {'task_name': 'Pending Approvals', 'count': pending_expenses_count + pending_trips_count},
            {'task_name': 'Pending Expenses', 'count': pending_expenses_count},
            {'task_name': 'Pending Trips', 'count': pending_trips_count},
            {'task_name': 'Unreported Expenses', 'count': Expense.objects.filter(employee=employee, status='approved', date__lt=timezone.now() - timedelta(days=7)).count()},
            {'task_name': 'Unreported Advances', 'value': float(Expense.objects.filter(employee=employee, status='pending', amount__gt=100).aggregate(total=Sum('amount'))['total'] or 0)}
        ]
        
        today = timezone.now().date()
        weeks_data = []
        for i in range(4):
            week_start = today - timedelta(days=today.weekday() + (7 * (3-i)))
            week_end = week_start + timedelta(days=6)
            
            if employee.role == 'admin':
                marketing_sum = Expense.objects.filter(team__name='Marketing', date__range=[week_start, week_end]).aggregate(total=Sum('amount'))['total'] or 0
                sales_sum = Expense.objects.filter(team__name='Sales', date__range=[week_start, week_end]).aggregate(total=Sum('amount'))['total'] or 0
                finance_sum = Expense.objects.filter(team__name='Finance', date__range=[week_start, week_end]).aggregate(total=Sum('amount'))['total'] or 0
            elif employee.role == 'manager' and employee.team:
                marketing_sum = Expense.objects.filter(team=employee.team, date__range=[week_start, week_end]).aggregate(total=Sum('amount'))['total'] or 0
                sales_sum = 0
                finance_sum = 0
            else:
                marketing_sum = Expense.objects.filter(employee=employee, date__range=[week_start, week_end]).aggregate(total=Sum('amount'))['total'] or 0
                sales_sum = 0
                finance_sum = 0
            
            weeks_data.append({
                'marketing': float(marketing_sum),
                'sales': float(sales_sum),
                'finance': float(finance_sum)
            })
        
        monthly_report = {
            'labels': [f'Week {i+1}' for i in range(4)],
            'marketing': [w['marketing'] for w in weeks_data],
            'sales': [w['sales'] for w in weeks_data],
            'finance': [w['finance'] for w in weeks_data]
        }
        
        total_expenses = Expense.objects.filter(employee=employee).count()
        total_amount = Expense.objects.filter(employee=employee).aggregate(total=Sum('amount'))['total'] or 0
        approved_amount = Expense.objects.filter(employee=employee, status='approved').aggregate(total=Sum('amount'))['total'] or 0
        
        data = {
            'expenses': ExpenseSerializer(recent_expenses, many=True).data,
            'pending_tasks': pending_tasks,
            'monthly_report': monthly_report,
            'stats': {
                'total_expenses': total_expenses,
                'total_amount': float(total_amount),
                'approved_amount': float(approved_amount),
                'pending_approvals': pending_expenses_count + pending_trips_count
            }
        }
        
        return Response(data)
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _expense_qs(employee):
    """Return an Expense queryset scoped to the employee's role."""
    if employee.role == 'admin':
        return Expense.objects.all()
    if employee.role == 'manager' and employee.team:
        return Expense.objects.filter(team=employee.team)
    return Expense.objects.filter(employee=employee)

def _trip_qs(employee):
    """Return a Trip queryset scoped to the employee's role."""
    if employee.role == 'admin':
        return Trip.objects.all()
    if employee.role == 'manager' and employee.team:
        return Trip.objects.filter(employee__team=employee.team)
    return Trip.objects.filter(employee=employee)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_tasks(request):
    """Return role-aware pending-task counts for the authenticated user."""
    try:
        employee = Employee.objects.select_related('team').get(user=request.user)
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    expenses = _expense_qs(employee)
    trips = _trip_qs(employee)
    now = timezone.now()
    today = now.date()
 
    printing_approvals_count = expenses.filter(status='pending').count()
 
    new_trips_count = trips.filter(
        status='pending',
        created_at__gte=now - timedelta(days=7),
    ).count()
 
    unreported_count = expenses.filter(
        status='approved',
        date__lt=today - timedelta(days=7),
        date__gte=today - timedelta(days=90),
    ).count()
 
    upcoming_count = trips.filter(
        status='approved',
        start_date__gte=today,
        start_date__lte=today + timedelta(days=14),
    ).count()
 
    personal_expenses = Expense.objects.filter(employee=employee)
    advances_value = (
        personal_expenses
        .filter(status='pending', amount__gt=100)
        .aggregate(total=Sum('amount'))['total']
        or 0
    )
    advances_count = (
        personal_expenses
        .filter(status='pending', amount__gt=100)
        .count()
    )
 
    tasks = [
        {
            'id': 1,
            'task_name': 'Printing Approvals',
            'count': printing_approvals_count,
        },
        {
            'id': 2,
            'task_name': 'New Trips Registered',
            'count': new_trips_count,
        },
        {
            'id': 3,
            'task_name': 'Unreported Expenses',
            'count': unreported_count,
        },
        {
            'id': 4,
            'task_name': 'Upcoming Expenses',
            'count': upcoming_count,
        },
        {
            'id': 5,
            'task_name': 'Unreported Advances',
            'count': advances_count,
            'value': float(advances_value),
        },
    ]
 
    return Response(tasks)