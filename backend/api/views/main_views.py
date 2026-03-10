# api/views/main_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
import json
import os
from ..models import Team, Employee, Category, Expense, Trip, PDFUpload
from ..serializers import (
    TeamSerializer, EmployeeSerializer, CategorySerializer,
    ExpenseSerializer, TripSerializer, PDFUploadSerializer
)

# ========== DASHBOARD API ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get all dashboard data with real-time statistics"""
    try:
        # Get user's employee profile
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get recent expenses (last 10) - filter by user's team/department based on role
        if employee.role == 'admin':
            recent_expenses = Expense.objects.all().order_by('-date', '-created_at')[:10]
        elif employee.role == 'manager':
            # Managers see their team's expenses
            recent_expenses = Expense.objects.filter(team=employee.team).order_by('-date', '-created_at')[:10]
        else:
            # Regular employees see only their own expenses
            recent_expenses = Expense.objects.filter(employee=employee).order_by('-date', '-created_at')[:10]
        
        # Calculate pending tasks dynamically
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
        
        # Generate monthly report data based on actual expenses
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
        
        # Get statistics
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
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pdf(request):
    """Handle PDF upload and return extracted data"""
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['file']
        
        if not pdf_file.name.endswith('.pdf'):
            return Response({'error': 'File must be a PDF'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get current user's employee profile
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            employee = None
        
        # Save PDF upload record
        pdf_upload = PDFUpload.objects.create(file=pdf_file, uploaded_by=employee)
        
        # Extract data from PDF (simulated for now)
        import random
        expenses_found = random.randint(1, 5)
        
        pdf_upload.processed = True
        pdf_upload.expenses_found = expenses_found
        pdf_upload.save()
        
        return Response({
            'message': 'PDF uploaded successfully',
            'expenses_found': expenses_found,
            'upload_id': pdf_upload.id
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== EXPENSE API ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list(request):
    """List all expenses or create new expense"""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Filtering options
        status_filter = request.query_params.get('status', None)
        team_filter = request.query_params.get('team', None)
        employee_filter = request.query_params.get('employee', None)
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        # Base queryset based on user role
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
        # Set the employee to current user if not specified
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
    
    # Check permission
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and expense.employee != employee:
            if employee.role == 'manager' and expense.team == employee.team:
                pass  # Manager can see team expenses
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
        
        # Filter based on role
        if employee.role == 'admin':
            expenses = Expense.objects.all()
        elif employee.role == 'manager' and employee.team:
            expenses = Expense.objects.filter(team=employee.team)
        else:
            expenses = Expense.objects.filter(employee=employee)
        
        # Status distribution
        status_counts = expenses.values('status').annotate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        # Category distribution
        category_stats = expenses.values('category__name', 'category__code').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        # Team distribution
        team_stats = expenses.values('team__name').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        # Monthly trends (last 6 months)
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
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== TRIP API ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def trip_list(request):
    """List all trips or create new trip"""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        status_filter = request.query_params.get('status', None)
        employee_filter = request.query_params.get('employee', None)
        
        # Base queryset based on role
        if employee.role == 'admin':
            trips = Trip.objects.all()
        elif employee.role == 'manager' and employee.team:
            trips = Trip.objects.filter(employee__team=employee.team)
        else:
            trips = Trip.objects.filter(employee=employee)
        
        trips = trips.order_by('-start_date')
        
        if status_filter:
            trips = trips.filter(status=status_filter)
        if employee_filter:
            trips = trips.filter(employee_id=employee_filter)
        
        serializer = TripSerializer(trips, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        if 'employee' not in data:
            data['employee'] = employee.id
        
        serializer = TripSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def trip_detail(request, pk):
    """Get, update or delete trip"""
    trip = get_object_or_404(Trip, pk=pk)
    
    # Check permission
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and trip.employee != employee:
            if employee.role == 'manager' and trip.employee.team == employee.team:
                pass  # Manager can see team trips
            else:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TripSerializer(trip)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TripSerializer(trip, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        trip.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trip_stats(request):
    """Get trip statistics"""
    try:
        employee = Employee.objects.get(user=request.user)
        
        # Filter based on role
        if employee.role == 'admin':
            trips = Trip.objects.all()
        elif employee.role == 'manager' and employee.team:
            trips = Trip.objects.filter(employee__team=employee.team)
        else:
            trips = Trip.objects.filter(employee=employee)
        
        status_counts = trips.values('status').annotate(
            count=Count('id'),
            total_estimated=Sum('estimated_expenses'),
            total_actual=Sum('actual_expenses')
        )
        
        upcoming_trips = trips.filter(
            start_date__gte=timezone.now().date(),
            status='approved'
        ).count()
        
        active_trips = trips.filter(
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
            status='approved'
        ).count()
        
        return Response({
            'status_distribution': status_counts,
            'upcoming_trips': upcoming_trips,
            'active_trips': active_trips,
            'total_trips': trips.count()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== EMPLOYEE API ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list(request):
    """List all employees or create new employee"""
    try:
        current_user = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Only admin and managers can list employees
        if current_user.role not in ['admin', 'manager']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        team_filter = request.query_params.get('team', None)
        department_filter = request.query_params.get('department', None)
        
        employees = Employee.objects.filter(is_active=True)
        
        if team_filter:
            employees = employees.filter(team_id=team_filter)
        if department_filter:
            employees = employees.filter(department=department_filter)
        
        # Managers can only see their team
        if current_user.role == 'manager' and current_user.team:
            employees = employees.filter(team=current_user.team)
        
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Only admin can create employees
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
    
    # Check permission
    try:
        current_user = Employee.objects.get(user=request.user)
        if current_user.role != 'admin' and current_user != employee:
            if current_user.role == 'manager' and employee.team == current_user.team:
                pass  # Manager can see team members
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

# ========== TEAM API ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def team_list(request):
    """List all teams"""
    try:
        current_user = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        teams = Team.objects.all()
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Only admin can create teams
        if current_user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_detail(request, pk):
    """Get team details with members and expenses"""
    team = get_object_or_404(Team, pk=pk)
    
    members = Employee.objects.filter(team=team, is_active=True)
    expenses = Expense.objects.filter(team=team).order_by('-date')[:20]
    
    data = {
        'team': TeamSerializer(team).data,
        'members': EmployeeSerializer(members, many=True).data,
        'recent_expenses': ExpenseSerializer(expenses, many=True).data,
        'stats': {
            'total_members': members.count(),
            'total_expenses': float(expenses.aggregate(total=Sum('amount'))['total'] or 0),
            'expense_count': expenses.count()
        }
    }
    
    return Response(data)

# ========== CATEGORY API ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def category_list(request):
    """List all categories"""
    try:
        current_user = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Only admin can create categories
        if current_user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ========== SEARCH API ==========

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
    
    # Search expenses based on role
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
    
    # Search trips
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
    
    # Search employees (only for admin and managers)
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

# ========== REPORTS API ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate expense report based on filters"""
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report_type = request.query_params.get('type', 'summary')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    team_id = request.query_params.get('team')
    employee_id = request.query_params.get('employee')
    
    # Base queryset based on role
    if employee.role == 'admin':
        expenses = Expense.objects.all()
    elif employee.role == 'manager' and employee.team:
        expenses = Expense.objects.filter(team=employee.team)
    else:
        expenses = Expense.objects.filter(employee=employee)
    
    # Apply filters
    if date_from:
        expenses = expenses.filter(date__gte=date_from)
    if date_to:
        expenses = expenses.filter(date__lte=date_to)
    if team_id and employee.role == 'admin':
        expenses = expenses.filter(team_id=team_id)
    if employee_id and employee.role == 'admin':
        expenses = expenses.filter(employee_id=employee_id)
    
    if report_type == 'summary':
        report = {
            'total_expenses': expenses.count(),
            'total_amount': float(expenses.aggregate(total=Sum('amount'))['total'] or 0),
            'by_status': expenses.values('status').annotate(
                count=Count('id'),
                total=Sum('amount')
            ),
            'by_category': expenses.values('category__name').annotate(
                count=Count('id'),
                total=Sum('amount')
            ).order_by('-total')[:10],
            'by_team': expenses.values('team__name').annotate(
                count=Count('id'),
                total=Sum('amount')
            ),
            'date_range': {
                'from': date_from,
                'to': date_to
            }
        }
    elif report_type == 'detailed':
        report = ExpenseSerializer(expenses.order_by('-date'), many=True).data
    
    return Response(report)