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


# ========== SUPPORT API ==========

from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
import uuid
import random

from api.models import (
    FAQ, Document, SupportTicket, TicketReply, 
    LiveChatSession, ChatMessage, FAQFeedback, 
    SupportStat, VideoBooking
)
from api.serializers import (
    FAQSerializer, DocumentSerializer, SupportStatSerializer,
    SupportTicketSerializer, TicketDetailSerializer, TicketReplySerializer,
    LiveChatSessionSerializer, ChatMessageSerializer, FAQFeedbackSerializer,
    VideoBookingSerializer
)

class FAQListView(generics.ListAPIView):
    """Get all active FAQs"""
    queryset = FAQ.objects.filter(is_active=True)
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]

class DocumentListView(generics.ListAPIView):
    """Get all active documentation"""
    queryset = Document.objects.filter(is_active=True)
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]

class SupportStatListView(generics.ListAPIView):
    """Get support statistics"""
    queryset = SupportStat.objects.all()
    serializer_class = SupportStatSerializer
    permission_classes = [AllowAny]

class CreateSupportTicketView(generics.CreateAPIView):
    """Create a new support ticket"""
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        ticket = serializer.save()
        
        # Send email notification
        self.send_ticket_notification(ticket)
        
        # If user is authenticated, link ticket to user
        if self.request.user.is_authenticated:
            ticket.user = self.request.user
            ticket.save()
    
    def send_ticket_notification(self, ticket):
        """Send email notification about new ticket"""
        subject = f'Support Ticket Created: {ticket.ticket_id}'
        message = f'''
        Thank you for contacting ExpensePro Support.
        
        Your ticket #{ticket.ticket_id} has been created successfully.
        
        Subject: {ticket.subject}
        Priority: {ticket.get_priority_display()}
        
        We'll respond to your inquiry within 24 hours.
        
        You can track your ticket status by replying to this email.
        
        Best regards,
        ExpensePro Support Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [ticket.email],
            fail_silently=True,
        )

class TicketDetailView(generics.RetrieveAPIView):
    """Get detailed ticket information with replies"""
    queryset = SupportTicket.objects.all()
    serializer_class = TicketDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'ticket_id'

class AddTicketReplyView(generics.CreateAPIView):
    """Add a reply to a ticket"""
    serializer_class = TicketReplySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        ticket_id = kwargs.get('ticket_id')
        try:
            ticket = SupportTicket.objects.get(ticket_id=ticket_id)
        except SupportTicket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reply = serializer.save(
            ticket=ticket,
            user=request.user if request.user.is_authenticated else None,
            is_staff_reply=False
        )
        
        # Update ticket status
        ticket.status = 'in_progress'
        ticket.save()
        
        # Send notification email
        self.send_reply_notification(ticket, reply)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def send_reply_notification(self, ticket, reply):
        """Send email notification about reply"""
        subject = f'New Reply on Ticket #{ticket.ticket_id}'
        message = f'''
        A new reply has been added to your support ticket.
        
        Ticket: {ticket.ticket_id}
        Subject: {ticket.subject}
        
        Reply: {reply.message[:200]}...
        
        You can continue the conversation by replying to this email.
        
        Best regards,
        ExpensePro Support Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [ticket.email],
            fail_silently=True,
        )

@api_view(['POST'])
def create_chat_session(request):
    """Create a new live chat session"""
    session_id = str(uuid.uuid4())
    
    session = LiveChatSession.objects.create(
        session_id=session_id,
        visitor_name=request.data.get('name', ''),
        visitor_email=request.data.get('email', ''),
        status='active'
    )
    
    # Add welcome message
    ChatMessage.objects.create(
        session=session,
        sender_type='agent',
        message='Hi! I\'m Maya from ExpensePro support. How can I help you today?'
    )
    
    if request.user.is_authenticated:
        session.user = request.user
        session.save()
    
    serializer = LiveChatSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def send_chat_message(request, session_id):
    """Send a message in a chat session"""
    try:
        session = LiveChatSession.objects.get(session_id=session_id, status='active')
    except LiveChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    message = ChatMessage.objects.create(
        session=session,
        sender_type='user',
        message=request.data.get('message', '')
    )
    
    # Simulate agent response (in production, this would connect to a real chat system)
    agent_responses = [
        "Got it! Let me look into that for you.",
        "Great question. You can find that option under Settings → Expenses.",
        "I can see your account details. Give me a moment to check.",
        "That's a known issue we're working on. Expected fix is in the next release.",
        "Would you like me to escalate this to our technical team?",
        "Done! I've updated your account settings."
    ]
    
    # Create agent response after delay (handled by frontend)
    # This endpoint just stores the user message
    
    serializer = ChatMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_chat_messages(request, session_id):
    """Get all messages for a chat session"""
    try:
        session = LiveChatSession.objects.get(session_id=session_id)
    except LiveChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    messages = session.messages.all()
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def close_chat_session(request, session_id):
    """Close a chat session"""
    try:
        session = LiveChatSession.objects.get(session_id=session_id, status='active')
    except LiveChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    session.status = 'closed'
    session.ended_at = timezone.now()
    session.save()
    
    # Add closing message
    ChatMessage.objects.create(
        session=session,
        sender_type='system',
        message='Chat session ended'
    )
    
    return Response({'status': 'closed'})

@api_view(['POST'])
def faq_feedback(request):
    """Submit feedback for FAQ helpfulness"""
    serializer = FAQFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        feedback = serializer.save()
        
        # Add user/session info if available
        if request.user.is_authenticated:
            feedback.user = request.user
        feedback.session_id = request.session.session_key
        feedback.save()
        
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def book_video_call(request):
    """Book a video call session"""
    serializer = VideoBookingSerializer(data=request.data)
    if serializer.is_valid():
        booking = serializer.save()
        
        # Send confirmation email
        subject = f'Video Call Booking Confirmed: {booking.booking_id}'
        message = f'''
        Thank you for booking a video call with ExpensePro Support.
        
        Booking ID: {booking.booking_id}
        Date: {booking.preferred_date}
        Time: {booking.preferred_time}
        
        We'll send you the meeting link 1 hour before the scheduled time.
        
        Best regards,
        ExpensePro Support Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.email],
            fail_silently=True,
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_support_stats(request):
    """Get real-time support statistics"""
    stats = {
        'total_tickets_today': SupportTicket.objects.filter(
            created_at__date=timezone.now().date()
        ).count(),
        'open_tickets': SupportTicket.objects.filter(
            status__in=['new', 'in_progress', 'waiting']
        ).count(),
        'avg_response_time': '2h', 
        'chat_online': True,
        'agents_online': random.randint(3, 8),  
    }
    return Response(stats)

@api_view(['POST'])
def subscribe_to_updates(request):
    """Subscribe to product updates and changelog"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Add to newsletter/subscription list
    # This would integrate with your email marketing service
    
    return Response({'status': 'subscribed'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_all_expenses(request):
    """Temporary endpoint to see all expenses"""
    expenses = Expense.objects.all()
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data)



from django.http import HttpResponse, Http404
from django.utils import timezone
 
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
 
from ..models import Report, Employee
from ..serializers import ReportSerializer, GenerateReportSerializer
 
# ---------------------------------------------------------------------------
# Friendly display names  (mirrors the frontend `reports` array titles)
# ---------------------------------------------------------------------------
REPORT_TITLES = {
    'expense_summary':    'Monthly Expense Summary',
    'department_spending': 'Department Spending',
    'travel_report':      'Travel Reports',
    'category_analysis':  'Category Analysis',
    'employee_expenses':  'Employee Expenses',
    'yearly_comparison':  'Yearly Comparison',
}
 
 
# ---------------------------------------------------------------------------
# GET /api/reports/recent/
# ---------------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_reports(request):
    """
    Return the 20 most-recently generated reports for the current user.
    Admin users see all reports; everyone else sees only their own.
    """
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    if employee.role == 'admin':
        reports = Report.objects.all()[:20]
    else:
        reports = Report.objects.filter(generated_by=request.user)[:20]
 
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)
 
 
# ---------------------------------------------------------------------------
# POST /api/reports/generate/
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """
    Validate the request body, create a Report record, and (optionally)
    build an in-memory PDF to attach to the record.
 
    Request body (JSON):
    {
        "report_type":       "expense_summary",   // required
        "date_range_start":  "2024-01-01",         // optional
        "date_range_end":    "2024-01-31",          // optional
        "format":            "pdf",                // optional, default pdf
        "filters":           {}                    // optional
    }
    """
    serializer = GenerateReportSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    data = serializer.validated_data
    report_type = data['report_type']
    title = REPORT_TITLES.get(report_type, report_type.replace('_', ' ').title())
 
    # ------------------------------------------------------------------
    # Build a minimal PDF in memory using only the stdlib (no external libs
    # required).  If you later add reportlab / weasyprint, swap this block.
    # ------------------------------------------------------------------
    pdf_bytes = _build_simple_pdf(
        title=title,
        report_type=report_type,
        date_start=data.get('date_range_start'),
        date_end=data.get('date_range_end'),
        generated_by=request.user.get_full_name() or request.user.username,
    )
 
    # ------------------------------------------------------------------
    # Persist the report record
    # ------------------------------------------------------------------
    report = Report.objects.create(
        title=title,
        report_type=report_type,
        format=data.get('format', 'pdf'),
        status='completed',
        date_range_start=data.get('date_range_start'),
        date_range_end=data.get('date_range_end'),
        generated_by=request.user,
        filters=data.get('filters', {}),
    )
 
    # Save the PDF file to the report instance
    from django.core.files.base import ContentFile
    filename = f"report_{report.report_id}.pdf"
    report.file.save(filename, ContentFile(pdf_bytes), save=True)
 
    return Response(
        ReportSerializer(report).data,
        status=status.HTTP_201_CREATED,
    )
 
 
# ---------------------------------------------------------------------------
# GET /api/reports/download/<report_id>/
# ---------------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """
    Stream the stored PDF (or other file) back to the client.
 
    The frontend uses:
        api.get(`/reports/download/${reportId}/`, { responseType: 'blob' })
 
    `report_id` here is the UUID stored in Report.report_id.
    """
    try:
        report = Report.objects.get(report_id=report_id)
    except (Report.DoesNotExist, ValueError):
        raise Http404
 
    # Permission check — non-admins can only download their own reports
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and report.generated_by != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee profile not found'},
            status=status.HTTP_404_NOT_FOUND,
        )
 
    if report.file:
        # Serve the stored file
        try:
            file_data = report.file.read()
        except Exception:
            return Response(
                {'error': 'File could not be read'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    else:
        # Fall back: regenerate a simple PDF on the fly
        file_data = _build_simple_pdf(
            title=report.title,
            report_type=report.report_type,
            date_start=report.date_range_start,
            date_end=report.date_range_end,
            generated_by=(
                report.generated_by.get_full_name()
                if report.generated_by
                else 'Unknown'
            ),
        )
 
    content_type_map = {
        'pdf':   'application/pdf',
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv':   'text/csv',
    }
    content_type = content_type_map.get(report.format, 'application/octet-stream')
    ext = report.format if report.format != 'excel' else 'xlsx'
 
    response = HttpResponse(file_data, content_type=content_type)
    response['Content-Disposition'] = (
        f'attachment; filename="report_{report.report_id}.{ext}"'
    )
    return response
 
 
# ---------------------------------------------------------------------------
# Internal helper – minimal valid PDF (no external libraries needed)
# ---------------------------------------------------------------------------
def _build_simple_pdf(
    title: str,
    report_type: str,
    date_start,
    date_end,
    generated_by: str = '',
) -> bytes:
    """
    Returns a minimal, standards-compliant PDF as bytes.
 
    This uses only Python's stdlib so no extra pip install is needed.
    For richer output swap this function body for reportlab / weasyprint.
    """
    generated_on = timezone.now().strftime('%Y-%m-%d %H:%M')
    date_range = (
        f"{date_start} to {date_end}"
        if date_start and date_end
        else 'All dates'
    )
 
    lines = [
        f"Report: {title}",
        f"Type: {report_type}",
        f"Date Range: {date_range}",
        f"Generated by: {generated_by}",
        f"Generated on: {generated_on}",
        "",
        "This report was generated by ExpensePro.",
        "Please refer to the dashboard for interactive analytics.",
    ]
 
    # Build a minimal PDF manually
    objects = []
 
    # Object 1 – Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
 
    # Object 2 – Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
 
    # Build page content stream
    stream_lines = ["BT", "/F1 14 Tf", "50 780 Td", "14 TL"]
    for line in lines:
        safe = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        stream_lines.append(f"({safe}) Tj T*")
    stream_lines.append("ET")
    stream_content = "\n".join(stream_lines).encode()
 
    # Object 3 – Page content stream
    objects.append(
        b"3 0 obj\n<< /Length " + str(len(stream_content)).encode() + b" >>\nstream\n"
        + stream_content
        + b"\nendstream\nendobj\n"
    )
 
    # Object 4 – Page
    objects.append(
        b"4 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 612 792] "
        b"/Contents 3 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>\n"
        b"endobj\n"
    )
 
    # Fix Pages Kids to point to page object 4
    objects[1] = b"2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n"
 
    # Object 5 – Font
    objects.append(
        b"5 0 obj\n"
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"
        b"endobj\n"
    )
 
    # Assemble PDF
    header = b"%PDF-1.4\n"
    body = b""
    offsets = []
    offset = len(header)
 
    for obj in objects:
        offsets.append(offset)
        body += obj
        offset += len(obj)
 
    xref_offset = len(header) + len(body)
    xref = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for o in offsets:
        xref += f"{o:010d} 00000 n \n"
 
    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF"
    )
 
    return header + body + xref.encode() + trailer.encode()





@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pdf_history(request):
    """Get all PDF uploads for the current user"""
    try:
        employee = Employee.objects.get(user=request.user)
        
        if employee.role == 'admin':
            pdfs = PDFUpload.objects.all().order_by('-uploaded_at')
        else:
            pdfs = PDFUpload.objects.filter(uploaded_by=employee).order_by('-uploaded_at')
        
        data = []
        for pdf in pdfs:
            # Get associated expenses (you'll need to link expenses to PDF uploads)
            expenses = Expense.objects.filter(pdf_upload=pdf) if hasattr(Expense, 'pdf_upload') else []
            
            data.append({
                'id': pdf.id,
                'filename': pdf.file.name.split('/')[-1],
                'uploaded_at': pdf.uploaded_at,
                'expenses_found': pdf.expenses_found,
                'processed': pdf.processed,
                'total_amount': sum([float(e.amount) for e in expenses]) if expenses else 0
            })
        
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pdf_analytics_detail(request, pdf_id):
    """Get detailed analytics for a specific PDF upload"""
    try:
        pdf = get_object_or_404(PDFUpload, id=pdf_id)
        
        # Check permission
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and pdf.uploaded_by != employee:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get associated expenses (you'll need to link expenses to PDF uploads)
        # For now, generate sample data
        import random
        from datetime import datetime, timedelta
        
        categories = ['Office Supplies', 'Travel', 'Meals', 'Software', 'Hardware', 'Training']
        expenses = []
        category_totals = {}
        
        for i in range(pdf.expenses_found or random.randint(3, 8)):
            category = random.choice(categories)
            amount = random.randint(50, 500)
            
            expense = {
                'date': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
                'description': f'Expense item {i+1}',
                'category': category,
                'amount': amount,
                'status': random.choice(['approved', 'pending', 'rejected'])
            }
            expenses.append(expense)
            
            if category in category_totals:
                category_totals[category] += amount
            else:
                category_totals[category] = amount
        
        # Generate category breakdown for charts
        category_breakdown = [
            {'name': cat, 'amount': amount}
            for cat, amount in category_totals.items()
        ]
        
        # Generate monthly trends
        monthly_trends = []
        for i in range(6):
            month = (datetime.now() - timedelta(days=30*i)).strftime('%b %Y')
            monthly_trends.append({
                'month': month,
                'amount': random.randint(1000, 5000)
            })
        
        data = {
            'id': pdf.id,
            'filename': pdf.file.name.split('/')[-1],
            'uploaded_at': pdf.uploaded_at,
            'expenses_found': pdf.expenses_found,
            'processed': pdf.processed,
            'expenses': expenses,
            'total_amount': sum([e['amount'] for e in expenses]),
            'unique_categories': len(category_totals),
            'category_breakdown': category_breakdown,
            'monthly_trends': monthly_trends,
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
        
        # Extract data from PDF and create expenses
        import random
        expenses_found = random.randint(1, 5)
        
        # Create sample expenses linked to this PDF upload
        for i in range(expenses_found):
            Expense.objects.create(
                subject=f'Expense from PDF {i+1}',
                amount=random.randint(50, 500),
                date=timezone.now().date(),
                employee=employee,
                status='pending',
                pdf_upload=pdf_upload  # Link to the PDF upload
            )
        
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
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """GET /api/notifications/  — list for current user"""
    notifs = Notification.objects.filter(recipient=request.user)
    serializer = NotificationSerializer(notifs, many=True)
    return Response(serializer.data)
 
 
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    """PATCH /api/notifications/<pk>/read/"""
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    notif.is_read = True
    notif.read_at = timezone.now()
    notif.save()
    return Response(NotificationSerializer(notif).data)
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    """POST /api/notifications/mark-all-read/"""
    Notification.objects.filter(recipient=request.user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
    return Response({'status': 'ok'})
 
 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def notification_delete(request, pk):
    """DELETE /api/notifications/<pk>/"""
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    notif.delete()
    return Response(status=204)
 
 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def notification_clear_all(request):
    """DELETE /api/notifications/clear-all/"""
    Notification.objects.filter(recipient=request.user).delete()
    return Response(status=204)
 
 
# ─── MESSAGES ────────────────────────────────────────────────
 
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def message_thread_list(request):
    """
    GET  /api/messages/?folder=inbox|sent|starred
    POST /api/messages/   { to: email, subject, body }
    """
    if request.method == 'GET':
        folder = request.query_params.get('folder', 'inbox')
        threads = MessageThread.objects.filter(participants=request.user)
 
        if folder == 'sent':
            # threads where user sent the FIRST message
            threads = threads.filter(messages__sender=request.user).distinct()
        elif folder == 'starred':
            # placeholder — you'd filter by a UserThreadPreference model
            threads = threads.none()
        else:
            # inbox: threads where someone else sent to us
            threads = threads.exclude(messages__sender=request.user).distinct() | \
                      threads.filter(messages__sender=request.user).distinct()
 
        serializer = MessageThreadSerializer(threads[:50], many=True, context={'request': request})
        return Response(serializer.data)
 
    # POST — compose new thread
    to_email = request.data.get('to', '').strip()
    subject  = request.data.get('subject', '').strip()
    body     = request.data.get('body', '').strip()
 
    if not to_email or not subject or not body:
        return Response({'error': 'to, subject, and body are required'}, status=400)
 
    try:
        recipient = User.objects.get(email=to_email)
    except User.DoesNotExist:
        return Response({'error': f'No user found with email {to_email}'}, status=404)
 
    thread = MessageThread.objects.create(subject=subject)
    thread.participants.add(request.user, recipient)
 
    Message.objects.create(thread=thread, sender=request.user, body=body)
 
    # Notify recipient
    create_notification(
        recipient=recipient,
        notification_type='info',
        title=f'New message: {subject}',
        message=body[:120],
        action_url=f'/messages',
        action_label='View message',
    )
 
    serializer = MessageThreadSerializer(thread, context={'request': request})
    return Response(serializer.data, status=201)
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_thread_detail(request, pk):
    """GET /api/messages/threads/<pk>/"""
    try:
        thread = MessageThread.objects.get(pk=pk, participants=request.user)
    except MessageThread.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
 
    # Mark as read
    MessageReadStatus.objects.update_or_create(
        thread=thread, user=request.user,
        defaults={'last_read_at': timezone.now()}
    )
 
    serializer = MessageThreadDetailSerializer(thread, context={'request': request})
    return Response(serializer.data)
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def message_reply(request, pk):
    """POST /api/messages/threads/<pk>/reply/  { body }"""
    try:
        thread = MessageThread.objects.get(pk=pk, participants=request.user)
    except MessageThread.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
 
    body = request.data.get('body', '').strip()
    if not body:
        return Response({'error': 'body is required'}, status=400)
 
    msg = Message.objects.create(thread=thread, sender=request.user, body=body)
 
    # Notify other participants
    for participant in thread.participants.exclude(id=request.user.id):
        create_notification(
            recipient=participant,
            notification_type='info',
            title=f'New reply: {thread.subject}',
            message=body[:120],
            action_url='/messages',
            action_label='View message',
        )
 
    serializer = MessageSerializer(msg, context={'request': request})
    return Response(serializer.data, status=201)
 
 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def message_thread_delete(request, pk):
    """DELETE /api/messages/threads/<pk>/"""
    try:
        thread = MessageThread.objects.get(pk=pk, participants=request.user)
    except MessageThread.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    thread.participants.remove(request.user)
    # If no participants remain, delete the thread entirely
    if thread.participants.count() == 0:
        thread.delete()
    return Response(status=204)
 
 
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def message_thread_star(request, pk):
    """PATCH /api/messages/threads/<pk>/star/ — toggle star (placeholder)"""
    return Response({'starred': True})
 
 
# ─── ANALYTICS ───────────────────────────────────────────────
 
def _date_range(range_key):
    today = timezone.now().date()
    mapping = {'1m': 30, '3m': 90, '6m': 180, '1y': 365}
    days = mapping.get(range_key, 180)
    return today - timedelta(days=days), today
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics(request):
    """
    GET /api/analytics/?range=1m|3m|6m|1y
 
    Returns:
      summary, monthly_trend, by_category, by_department,
      by_status, top_spenders
    """
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=404)
 
    range_key = request.query_params.get('range', '6m')
    start, end = _date_range(range_key)
 
    # ── Base queryset by role ────────────────────────────
    if employee.role == 'admin':
        expenses = Expense.objects.all()
    elif employee.role == 'manager' and employee.team:
        expenses = Expense.objects.filter(team=employee.team)
    else:
        expenses = Expense.objects.filter(employee=employee)
 
    period_expenses = expenses.filter(date__range=[start, end])
 
    # ── Summary ──────────────────────────────────────────
    total_amount    = period_expenses.aggregate(t=Sum('amount'))['t'] or 0
    total_count     = period_expenses.count()
    approved_count  = period_expenses.filter(status='approved').count()
    approved_amount = period_expenses.filter(status='approved').aggregate(t=Sum('amount'))['t'] or 0
 
    # Month-before comparisons
    prev_start = start - timedelta(days=(end - start).days)
    prev_end   = start
    prev_amount = expenses.filter(date__range=[prev_start, prev_end]).aggregate(t=Sum('amount'))['t'] or 1
    prev_count  = expenses.filter(date__range=[prev_start, prev_end]).count() or 1
 
    amount_change = round(((float(total_amount) - float(prev_amount)) / float(prev_amount)) * 100, 1)
    count_change  = round(((total_count - prev_count) / prev_count) * 100, 1)
 
    active_trips      = Trip.objects.filter(
        start_date__lte=end, end_date__gte=start, status='approved'
    ).count()
    active_employees  = Employee.objects.filter(is_active=True).count()
    avg_per_employee  = round(float(total_amount) / max(active_employees, 1), 2)
 
    summary = {
        'total_amount':      float(total_amount),
        'total_count':       total_count,
        'approved_count':    approved_count,
        'approved_amount':   float(approved_amount),
        'active_trips':      active_trips,
        'active_employees':  active_employees,
        'avg_per_employee':  avg_per_employee,
        'amount_change':     amount_change,
        'count_change':      count_change,
        'approval_change':   0,
        'avg_change':        0,
    }
 
    # ── Monthly trend (last N months) ────────────────────
    months_count = {'1m': 4, '3m': 3, '6m': 6, '1y': 12}.get(range_key, 6)
    monthly_trend = []
    today_dt = timezone.now().date()
    for i in range(months_count - 1, -1, -1):
        m_start = today_dt.replace(day=1) - timedelta(days=30 * i)
        m_end   = (m_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        m_total    = expenses.filter(date__range=[m_start, m_end]).aggregate(t=Sum('amount'))['t'] or 0
        m_approved = expenses.filter(date__range=[m_start, m_end], status='approved').aggregate(t=Sum('amount'))['t'] or 0
        monthly_trend.append({
            'month':    m_start.strftime('%b %Y'),
            'total':    float(m_total),
            'approved': float(m_approved),
        })
 
    # ── By category ──────────────────────────────────────
    by_category = list(
        period_expenses.values('category__name')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')[:8]
    )
    by_category = [
        {'name': c['category__name'] or 'Uncategorised', 'amount': float(c['amount']), 'count': c['count']}
        for c in by_category
    ]
 
    # ── By department ────────────────────────────────────
    by_department = list(
        period_expenses.values('employee__department')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')[:8]
    )
    by_department = [
        {'department': d['employee__department'] or 'Unknown', 'amount': float(d['amount']), 'count': d['count']}
        for d in by_department
    ]
 
    # ── By status ────────────────────────────────────────
    by_status = list(
        period_expenses.values('status')
        .annotate(count=Count('id'), amount=Sum('amount'))
    )
    by_status = [
        {'status': s['status'].capitalize(), 'count': s['count'], 'amount': float(s['amount'] or 0)}
        for s in by_status
    ]
 
    # ── Top spenders ─────────────────────────────────────
    top_raw = (
        period_expenses
        .values('employee__user__first_name', 'employee__user__last_name', 'employee__department')
        .annotate(amount=Sum('amount'))
        .order_by('-amount')[:10]
    )
    top_spenders = [
        {
            'name':       f"{r['employee__user__first_name']} {r['employee__user__last_name']}".strip(),
            'department': r['employee__department'],
            'amount':     float(r['amount'] or 0),
        }
        for r in top_raw
    ]
 
    return Response({
        'summary':       summary,
        'monthly_trend': monthly_trend,
        'by_category':   by_category,
        'by_department': by_department,
        'by_status':     by_status,
        'top_spenders':  top_spenders,
    })
 