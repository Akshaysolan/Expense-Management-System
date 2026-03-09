# backend/api/views.py (Simplified version for testing)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from .models import Expense, PendingTask
from .serializers import ExpenseSerializer, PendingTaskSerializer

@api_view(['GET'])
def get_dashboard_data(request):
    """Get all dashboard data"""
    try:
        # Get recent expenses
        expenses = Expense.objects.all().order_by('-id')[:5]
        
        # Get pending tasks
        pending_tasks = PendingTask.objects.all()
        
        # If no tasks exist, create default ones
        if not pending_tasks.exists():
            default_tasks = [
                {'task_type': 'printing', 'count': 5, 'value': None},
                {'task_type': 'trips', 'count': 1, 'value': None},
                {'task_type': 'unreported', 'count': 4, 'value': None},
                {'task_type': 'upcoming', 'count': 0, 'value': None},
                {'task_type': 'advances', 'count': 0, 'value': 0.00},
            ]
            for task_data in default_tasks:
                PendingTask.objects.create(**task_data)
            pending_tasks = PendingTask.objects.all()
        
        # Serialize data
        expenses_serializer = ExpenseSerializer(expenses, many=True)
        tasks_serializer = PendingTaskSerializer(pending_tasks, many=True)
        
        # Calculate stats
        thirty_days_ago = datetime.now() - timedelta(days=30)
        total_spent = Expense.objects.filter(
            date__gte=thirty_days_ago
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Monthly report data
        monthly_data = {
            'labels': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            'marketing': [1200, 1500, 1100, 1800],
            'sales': [2100, 1900, 2200, 2000],
            'finance': [800, 950, 1100, 900],
        }
        
        return Response({
            'expenses': expenses_serializer.data,
            'pending_tasks': tasks_serializer.data,
            'monthly_report': monthly_data,
            'stats': {
                'total_spent': float(total_spent),
                'total_expenses': Expense.objects.count(),
                'pending_approvals': 5,
                'active_trips': 3
            }
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def upload_pdf(request):
    """Upload and process PDF file"""
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    pdf_file = request.FILES['file']
    
    # Check file type
    if not pdf_file.name.endswith('.pdf'):
        return Response(
            {'error': 'File must be a PDF'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        import PyPDF2
        import re
        
        # Process PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Simple extraction logic
        expenses = []
        lines = text.split('\n')
        
        for line in lines:
            # Look for amounts
            amount_match = re.search(r'[€$]\s*(\d+(?:[.,]\d{2})?)', line)
            if amount_match:
                try:
                    amount = float(amount_match.group(1).replace(',', '.'))
                    
                    # Create expense entry
                    expense_data = {
                        'subject': 'Extracted from PDF',
                        'employee': 'System Import',
                        'team': 'General',
                        'amount': amount,
                        'category': 'other'
                    }
                    
                    # Try to find subject in line
                    words = line.split()
                    for word in words:
                        if len(word) > 5 and word[0].isupper():
                            expense_data['subject'] = word
                            break
                    
                    expenses.append(expense_data)
                except:
                    continue
        
        # Save expenses
        saved_count = 0
        for expense_data in expenses[:10]:  # Limit to 10 for testing
            try:
                Expense.objects.create(**expense_data)
                saved_count += 1
            except:
                continue
        
        return Response({
            'message': 'PDF processed successfully',
            'expenses_found': len(expenses),
            'expenses_saved': saved_count
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def add_expense(request):
    """Add a new expense manually"""
    serializer = ExpenseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_expenses(request):
    """Get all expenses with optional filtering"""
    expenses = Expense.objects.all().order_by('-date')
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'healthy', 'timestamp': datetime.now().isoformat()})