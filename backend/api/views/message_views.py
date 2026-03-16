from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.utils import timezone
from api.models.messaging import MessageThread, Message, MessageReadStatus, create_notification
from api.serializers.messaging import MessageThreadSerializer, MessageThreadDetailSerializer, MessageSerializer
import logging

logger = logging.getLogger(__name__)

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
            threads = threads.filter(messages__sender=request.user).distinct()
        elif folder == 'starred':
            threads = threads.none()
        else:
            threads = threads.exclude(messages__sender=request.user).distinct() | \
                      threads.filter(messages__sender=request.user).distinct()
 
        serializer = MessageThreadSerializer(threads[:50], many=True, context={'request': request})
        return Response(serializer.data)
 
    # POST — compose new thread
    to_email = request.data.get('to', '').strip()
    subject = request.data.get('subject', '').strip()
    body = request.data.get('body', '').strip()
 
    if not to_email or not subject or not body:
        return Response({'error': 'to, subject, and body are required'}, status=400)
 
    try:
        recipient = User.objects.get(email=to_email)
    except User.DoesNotExist:
        return Response({'error': f'No user found with email {to_email}'}, status=404)
 
    thread = MessageThread.objects.create(subject=subject)
    thread.participants.add(request.user, recipient)
 
    Message.objects.create(thread=thread, sender=request.user, body=body)
 
    create_notification(
        recipient=recipient,
        notification_type='info',
        title=f'New message: {subject}',
        message=body[:120],
        action_url='/messages',
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
    if thread.participants.count() == 0:
        thread.delete()
    return Response(status=204)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def message_thread_star(request, pk):
    """PATCH /api/messages/threads/<pk>/star/ — toggle star (placeholder)"""
    return Response({'starred': True})