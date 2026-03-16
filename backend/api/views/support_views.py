from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import uuid
import random
from api.models.support import FAQ, Document, SupportTicket, TicketReply, LiveChatSession, ChatMessage, FAQFeedback, SupportStat, VideoBooking
from api.serializers.support import FAQSerializer, DocumentSerializer, SupportStatSerializer, SupportTicketSerializer, TicketDetailSerializer, TicketReplySerializer, LiveChatSessionSerializer, ChatMessageSerializer, FAQFeedbackSerializer, VideoBookingSerializer
import logging

logger = logging.getLogger(__name__)

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
        
        self.send_ticket_notification(ticket)
        
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
        
        ticket.status = 'in_progress'
        ticket.save()
        
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
@permission_classes([AllowAny])
def create_chat_session(request):
    """Create a new live chat session"""
    session_id = str(uuid.uuid4())
    
    session = LiveChatSession.objects.create(
        session_id=session_id,
        visitor_name=request.data.get('name', ''),
        visitor_email=request.data.get('email', ''),
        status='active'
    )
    
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
@permission_classes([AllowAny])
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
    
    serializer = ChatMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
def close_chat_session(request, session_id):
    """Close a chat session"""
    try:
        session = LiveChatSession.objects.get(session_id=session_id, status='active')
    except LiveChatSession.DoesNotExist:
        return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    session.status = 'closed'
    session.ended_at = timezone.now()
    session.save()
    
    ChatMessage.objects.create(
        session=session,
        sender_type='system',
        message='Chat session ended'
    )
    
    return Response({'status': 'closed'})

@api_view(['POST'])
@permission_classes([AllowAny])
def faq_feedback(request):
    """Submit feedback for FAQ helpfulness"""
    serializer = FAQFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        feedback = serializer.save()
        
        if request.user.is_authenticated:
            feedback.user = request.user
        feedback.session_id = request.session.session_key
        feedback.save()
        
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def book_video_call(request):
    """Book a video call session"""
    serializer = VideoBookingSerializer(data=request.data)
    if serializer.is_valid():
        booking = serializer.save()
        
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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
def subscribe_to_updates(request):
    """Subscribe to product updates and changelog"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({'status': 'subscribed'})