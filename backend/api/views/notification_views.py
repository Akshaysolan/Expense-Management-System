from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from api.models.messaging import Notification
from api.serializers.messaging import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """GET /api/notifications/ — list for current user"""
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