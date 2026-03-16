from rest_framework import serializers
from api.models.messaging import Notification, Message, MessageThread

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'action_url', 'action_label', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
 
    class Meta:
        model = Message
        fields = ['id', 'sender_name', 'is_mine', 'body', 'created_at']
 
    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.username
        return 'Unknown'
 
    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender == request.user

class MessageThreadSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    is_starred = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
 
    class Meta:
        model = MessageThread
        fields = [
            'id', 'subject', 'sender_name', 'preview',
            'is_read', 'is_starred', 'last_message_at', 'created_at',
        ]
 
    def _other_participant(self, obj):
        request = self.context.get('request')
        return obj.participants.exclude(id=request.user.id).first() if request else None
 
    def get_sender_name(self, obj):
        other = self._other_participant(obj)
        return other.get_full_name() or other.username if other else 'Unknown'
 
    def get_preview(self, obj):
        last = obj.get_last_message()
        return (last.body[:80] + '…') if last and len(last.body) > 80 else (last.body if last else '')
 
    def get_is_read(self, obj):
        request = self.context.get('request')
        return obj.is_read_by(request.user) if request else True
 
    def get_is_starred(self, obj):
        return False
 
    def get_last_message_at(self, obj):
        last = obj.get_last_message()
        return last.created_at.isoformat() if last else obj.created_at.isoformat()

class MessageThreadDetailSerializer(MessageThreadSerializer):
    messages = serializers.SerializerMethodField()
 
    class Meta(MessageThreadSerializer.Meta):
        fields = MessageThreadSerializer.Meta.fields + ['messages']
 
    def get_messages(self, obj):
        msgs = obj.messages.order_by('created_at')
        return MessageSerializer(msgs, many=True, context=self.context).data