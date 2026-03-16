from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from api.models.base import Team, Employee
from api.models.expense import Expense
from api.serializers.team import TeamSerializer
from api.serializers.employee import EmployeeSerializer
from api.serializers.expense import ExpenseSerializer
import logging

logger = logging.getLogger(__name__)

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