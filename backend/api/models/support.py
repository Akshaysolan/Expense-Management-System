from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class FAQ(models.Model):
    CATEGORY_CHOICES = [
        ('Expenses', 'Expenses'),
        ('Approvals', 'Approvals'),
        ('Reports', 'Reports'),
        ('Trips', 'Trips'),
        ('Account', 'Account'),
        ('General', 'General'),
    ]
    
    question = models.CharField(max_length=500)
    answer = models.TextField()
    tag = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return self.question[:50]

class Document(models.Model):
    title = models.CharField(max_length=200)
    icon = models.CharField(max_length=10, default='📄')
    description = models.TextField()
    file = models.FileField(upload_to='documents/', blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return self.title

class SupportTicket(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low — general inquiry'),
        ('normal', 'Normal — needs attention'),
        ('high', 'High — urgent issue'),
        ('critical', 'Critical — production down'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('waiting', 'Waiting for customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    attachments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.ticket_id} - {self.subject}"

class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']

class LiveChatSession(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    visitor_name = models.CharField(max_length=100, blank=True)
    visitor_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, default='active')
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Chat {self.session_id}"

class ChatMessage(models.Model):
    session = models.ForeignKey(LiveChatSession, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=[('user', 'User'), ('agent', 'Agent'), ('system', 'System')])
    sender_id = models.CharField(max_length=100, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']

class FAQFeedback(models.Model):
    faq = models.ForeignKey(FAQ, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    is_helpful = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

class SupportStat(models.Model):
    name = models.CharField(max_length=50)
    value = models.CharField(max_length=20)
    suffix = models.CharField(max_length=10, blank=True)
    label = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name}: {self.value}{self.suffix}"

class VideoBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    preferred_date = models.DateField()
    preferred_time = models.TimeField()
    topic = models.TextField()
    booking_id = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=20, default='pending')
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = f"VID-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)