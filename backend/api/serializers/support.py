from rest_framework import serializers
from django.contrib.auth import get_user_model
from api.models.support import FAQ, Document, SupportTicket, TicketReply, LiveChatSession, ChatMessage, FAQFeedback, SupportStat, VideoBooking

User = get_user_model()

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer', 'tag', 'order']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'icon', 'description', 'external_url', 'order']

class SupportStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportStat
        fields = ['name', 'value', 'suffix', 'label']

class SupportTicketSerializer(serializers.ModelSerializer):
    ticket_id = serializers.ReadOnlyField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_id', 'name', 'email', 'subject', 
            'message', 'priority', 'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at', 'ticket_id']

class TicketReplySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketReply
        fields = ['id', 'message', 'is_staff_reply', 'user_name', 'created_at']
        read_only_fields = ['is_staff_reply', 'created_at']
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

class TicketDetailSerializer(serializers.ModelSerializer):
    replies = TicketReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_id', 'name', 'email', 'subject', 
            'message', 'priority', 'status', 'created_at', 
            'updated_at', 'resolved_at', 'replies'
        ]

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_type', 'message', 'created_at']

class LiveChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = LiveChatSession
        fields = ['id', 'session_id', 'visitor_name', 'visitor_email', 'status', 'messages', 'created_at']

class FAQFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQFeedback
        fields = ['faq', 'is_helpful']

class VideoBookingSerializer(serializers.ModelSerializer):
    booking_id = serializers.ReadOnlyField()
    
    class Meta:
        model = VideoBooking
        fields = [
            'id', 'booking_id', 'name', 'email', 
            'preferred_date', 'preferred_time', 'topic', 
            'status', 'meeting_link', 'created_at'
        ]
        read_only_fields = ['status', 'meeting_link', 'created_at', 'booking_id']