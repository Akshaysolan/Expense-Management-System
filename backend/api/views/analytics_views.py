from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from api.models.base import Employee
from api.models.expense import Expense
from api.models.trip import Trip
import logging

logger = logging.getLogger(__name__)

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
 
    if employee.role == 'admin':
        expenses = Expense.objects.all()
    elif employee.role == 'manager' and employee.team:
        expenses = Expense.objects.filter(team=employee.team)
    else:
        expenses = Expense.objects.filter(employee=employee)
 
    period_expenses = expenses.filter(date__range=[start, end])
 
    total_amount = period_expenses.aggregate(t=Sum('amount'))['t'] or 0
    total_count = period_expenses.count()
    approved_count = period_expenses.filter(status='approved').count()
    approved_amount = period_expenses.filter(status='approved').aggregate(t=Sum('amount'))['t'] or 0
 
    prev_start = start - timedelta(days=(end - start).days)
    prev_end = start
    prev_amount = expenses.filter(date__range=[prev_start, prev_end]).aggregate(t=Sum('amount'))['t'] or 1
    prev_count = expenses.filter(date__range=[prev_start, prev_end]).count() or 1
 
    amount_change = round(((float(total_amount) - float(prev_amount)) / float(prev_amount)) * 100, 1)
    count_change = round(((total_count - prev_count) / prev_count) * 100, 1)
 
    active_trips = Trip.objects.filter(
        start_date__lte=end, end_date__gte=start, status='approved'
    ).count()
    active_employees = Employee.objects.filter(is_active=True).count()
    avg_per_employee = round(float(total_amount) / max(active_employees, 1), 2)
 
    summary = {
        'total_amount': float(total_amount),
        'total_count': total_count,
        'approved_count': approved_count,
        'approved_amount': float(approved_amount),
        'active_trips': active_trips,
        'active_employees': active_employees,
        'avg_per_employee': avg_per_employee,
        'amount_change': amount_change,
        'count_change': count_change,
        'approval_change': 0,
        'avg_change': 0,
    }
 
    months_count = {'1m': 4, '3m': 3, '6m': 6, '1y': 12}.get(range_key, 6)
    monthly_trend = []
    today_dt = timezone.now().date()
    for i in range(months_count - 1, -1, -1):
        m_start = today_dt.replace(day=1) - timedelta(days=30 * i)
        m_end = (m_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        m_total = expenses.filter(date__range=[m_start, m_end]).aggregate(t=Sum('amount'))['t'] or 0
        m_approved = expenses.filter(date__range=[m_start, m_end], status='approved').aggregate(t=Sum('amount'))['t'] or 0
        monthly_trend.append({
            'month': m_start.strftime('%b %Y'),
            'total': float(m_total),
            'approved': float(m_approved),
        })
 
    by_category = list(
        period_expenses.values('category__name')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')[:8]
    )
    by_category = [
        {'name': c['category__name'] or 'Uncategorised', 'amount': float(c['amount']), 'count': c['count']}
        for c in by_category
    ]
 
    by_department = list(
        period_expenses.values('employee__department')
        .annotate(amount=Sum('amount'), count=Count('id'))
        .order_by('-amount')[:8]
    )
    by_department = [
        {'department': d['employee__department'] or 'Unknown', 'amount': float(d['amount']), 'count': d['count']}
        for d in by_department
    ]
 
    by_status = list(
        period_expenses.values('status')
        .annotate(count=Count('id'), amount=Sum('amount'))
    )
    by_status = [
        {'status': s['status'].capitalize(), 'count': s['count'], 'amount': float(s['amount'] or 0)}
        for s in by_status
    ]
 
    top_raw = (
        period_expenses
        .values('employee__user__first_name', 'employee__user__last_name', 'employee__department')
        .annotate(amount=Sum('amount'))
        .order_by('-amount')[:10]
    )
    top_spenders = [
        {
            'name': f"{r['employee__user__first_name']} {r['employee__user__last_name']}".strip(),
            'department': r['employee__department'],
            'amount': float(r['amount'] or 0),
        }
        for r in top_raw
    ]
 
    return Response({
        'summary': summary,
        'monthly_trend': monthly_trend,
        'by_category': by_category,
        'by_department': by_department,
        'by_status': by_status,
        'top_spenders': top_spenders,
    })