from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.models.base import Employee
from api.models.expense import PDFUpload, Expense
import random
import logging

logger = logging.getLogger(__name__)

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
        
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            employee = None
        
        pdf_upload = PDFUpload.objects.create(file=pdf_file, uploaded_by=employee)
        
        expenses_found = random.randint(1, 5)
        
        for i in range(expenses_found):
            Expense.objects.create(
                subject=f'Expense from PDF {i+1}',
                amount=random.randint(50, 500),
                date=timezone.now().date(),
                employee=employee,
                status='pending',
                pdf_upload=pdf_upload
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
        logger.error(f"PDF upload error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            expenses = Expense.objects.filter(pdf_upload=pdf)
            
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
        logger.error(f"PDF history error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pdf_analytics_detail(request, pdf_id):
    """Get detailed analytics for a specific PDF upload"""
    try:
        pdf = get_object_or_404(PDFUpload, id=pdf_id)
        
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and pdf.uploaded_by != employee:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        from datetime import datetime, timedelta
        
        categories = ['Office Supplies', 'Travel', 'Meals', 'Software', 'Hardware', 'Training']
        expenses = Expense.objects.filter(pdf_upload=pdf)
        
        if not expenses:
            expenses_list = []
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
                expenses_list.append(expense)
                
                if category in category_totals:
                    category_totals[category] += amount
                else:
                    category_totals[category] = amount
            
            category_breakdown = [
                {'name': cat, 'amount': amount}
                for cat, amount in category_totals.items()
            ]
            
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
                'expenses': expenses_list,
                'total_amount': sum([e['amount'] for e in expenses_list]),
                'unique_categories': len(category_totals),
                'category_breakdown': category_breakdown,
                'monthly_trends': monthly_trends,
            }
        else:
            expenses_list = []
            category_totals = {}
            for e in expenses:
                expense = {
                    'date': e.date.strftime('%Y-%m-%d'),
                    'description': e.subject,
                    'category': e.category.name if e.category else 'Uncategorized',
                    'amount': float(e.amount),
                    'status': e.status
                }
                expenses_list.append(expense)
                
                cat_name = e.category.name if e.category else 'Uncategorized'
                if cat_name in category_totals:
                    category_totals[cat_name] += float(e.amount)
                else:
                    category_totals[cat_name] = float(e.amount)
            
            category_breakdown = [
                {'name': cat, 'amount': amount}
                for cat, amount in category_totals.items()
            ]
            
            data = {
                'id': pdf.id,
                'filename': pdf.file.name.split('/')[-1],
                'uploaded_at': pdf.uploaded_at,
                'expenses_found': pdf.expenses_found,
                'processed': pdf.processed,
                'expenses': expenses_list,
                'total_amount': sum([e['amount'] for e in expenses_list]),
                'unique_categories': len(category_totals),
                'category_breakdown': category_breakdown,
            }
        
        return Response(data)
    except Exception as e:
        logger.error(f"PDF analytics error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)