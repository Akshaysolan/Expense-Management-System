from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.utils import timezone
from api.models.base import Employee
from api.models.trip import Trip
from api.serializers.trip import TripSerializer
import logging

logger = logging.getLogger(__name__)

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
    
    try:
        employee = Employee.objects.get(user=request.user)
        if employee.role != 'admin' and trip.employee != employee:
            if employee.role == 'manager' and trip.employee.team == employee.team:
                pass
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
        logger.error(f"Trip stats error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)