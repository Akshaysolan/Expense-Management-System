from django.db import models
from django.contrib.auth.models import User
import uuid

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('expense_approved',  'Expense Approved'),
        ('expense_rejected',  'Expense Rejected'),
        ('expense_submitted', 'Expense Submitted'),
        ('trip_approved',     'Trip Approved'),
        ('trip_rejected',     'Trip Rejected'),
        ('trip_submitted',    'Trip Submitted'),
        ('approval_needed',   'Approval Needed'),
        ('report_ready',      'Report Ready'),
        ('system_alert',      'System Alert'),
        ('info',              'Info'),
        ('budget_warning',    'Budget Warning'),
        ('profile_update',    'Profile Updated'),
    ]
 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES, default='info')
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.CharField(max_length=300, blank=True)
    action_label = models.CharField(max_length=100, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Fix these foreign keys - use the correct app/model names
    related_expense = models.ForeignKey(
        'api.Expense',  # Changed from 'expense.Expense' to 'api.Expense'
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='notifications'
    )
    related_trip = models.ForeignKey(
        'api.Trip',  # Changed from 'trip.Trip' to 'api.Trip'
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='notifications'
    )
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.email}"

class MessageThread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=300)
    participants = models.ManyToManyField(User, related_name='message_threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ['-updated_at']
 
    def __str__(self):
        return self.subject
 
    def get_last_message(self):
        return self.messages.order_by('-created_at').first()
 
    def is_read_by(self, user):
        last = self.get_last_message()
        if not last:
            return True
        return MessageReadStatus.objects.filter(
            thread=self, user=user, last_read_at__gte=last.created_at
        ).exists()

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ['created_at']
 
    def __str__(self):
        return f"Message in {self.thread.subject}"

class MessageReadStatus(models.Model):
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    last_read_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        unique_together = ('thread', 'user')

def create_notification(recipient, notification_type, title, message,
                        action_url='', action_label='',
                        related_expense=None, related_trip=None):
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        action_label=action_label,
        related_expense=related_expense,
        related_trip=related_trip,
    )