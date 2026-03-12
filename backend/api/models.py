from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from django.contrib.auth import get_user_model

class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Employee(models.Model):
    ROLE_CHOICES = [
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('finance', 'Finance'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    position = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

class Category(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.now)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='expenses')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    receipt_file = models.FileField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    pdf_upload = models.ForeignKey('PDFUpload', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')

    def __str__(self):
        return f"{self.subject} - {self.amount}"

class Trip(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    destination = models.CharField(max_length=200)
    purpose = models.TextField()
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='trips')
    start_date = models.DateField()
    end_date = models.DateField()
    estimated_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.destination} - {self.employee.user.get_full_name()}"

class PDFUpload(models.Model):
    file = models.FileField(upload_to='pdf_uploads/')
    processed = models.BooleanField(default=False)
    expenses_found = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"PDF Upload {self.id}"

# Optional PendingTask model for dashboard tasks
class PendingTask(models.Model):
    TASK_TYPES = [
        ('printing', 'Printing Approvals'),
        ('trips', 'New Trips Registered'),
        ('unreported', 'Unreported Expenses'),
        ('upcoming', 'Upcoming Expenses'),
        ('advances', 'Unreported Advances'),
    ]
    
    task_type = models.CharField(max_length=50, choices=TASK_TYPES)
    count = models.IntegerField(default=0)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_task_type_display()}: {self.count}"


# ========== SUPPORT APP MODELS ==========

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
    status = models.CharField(max_length=20, default='active')  # active, closed, transferred
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
    status = models.CharField(max_length=20, default='pending')  # pending, confirmed, cancelled
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = f"VID-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('expense_summary', 'Monthly Expense Summary'),
        ('department_spending', 'Department Spending'),
        ('travel_report', 'Travel Reports'),
        ('category_analysis', 'Category Analysis'),
        ('employee_expenses', 'Employee Expenses'),
        ('yearly_comparison', 'Yearly Comparison'),
    ]
 
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    ]
 
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
 
    report_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
 
    # Date range for the report
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
 
    # Who generated it
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='generated_reports'
    )
 
    # The generated file (optional — used if you store actual PDFs)
    file = models.FileField(upload_to='reports/', null=True, blank=True)
 
    # Metadata / filters used when generating
    filters = models.JSONField(default=dict, blank=True)
 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"{self.title} ({self.report_id})"
 



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
 
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES, default='info')
    title             = models.CharField(max_length=200)
    message           = models.TextField()
    action_url        = models.CharField(max_length=300, blank=True)
    action_label      = models.CharField(max_length=100, blank=True)
    is_read           = models.BooleanField(default=False)
    created_at        = models.DateTimeField(auto_now_add=True)
    read_at           = models.DateTimeField(null=True, blank=True)
 
    # Optional: link to a related object
    related_expense   = models.ForeignKey('Expense', on_delete=models.SET_NULL, null=True, blank=True)
    related_trip      = models.ForeignKey('Trip',    on_delete=models.SET_NULL, null=True, blank=True)
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.email}"
 
 
# ─────────────────────────────────────────────────────────────
# MESSAGES / INBOX
# ─────────────────────────────────────────────────────────────
 
class MessageThread(models.Model):
    """A conversation thread between users."""
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject       = models.CharField(max_length=300)
    participants  = models.ManyToManyField(User, related_name='message_threads')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
 
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
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread     = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    body       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ['created_at']
 
    def __str__(self):
        return f"Message in {self.thread.subject}"
 
 
class MessageReadStatus(models.Model):
    thread       = models.ForeignKey(MessageThread, on_delete=models.CASCADE)
    user         = models.ForeignKey(User, on_delete=models.CASCADE)
    last_read_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        unique_together = ('thread', 'user')
 
 
# ─────────────────────────────────────────────────────────────
# Utility: create_notification helper
# ─────────────────────────────────────────────────────────────
 
def create_notification(recipient, notification_type, title, message,
                        action_url='', action_label='',
                        related_expense=None, related_trip=None):
    """
    Convenience helper. Call this from your expense/trip views
    whenever an action requires a notification.
 
    Example:
        create_notification(
            recipient=expense.employee.user,
            notification_type='expense_approved',
            title='Your expense was approved',
            message=f'"{expense.subject}" has been approved.',
            action_url=f'/expenses/{expense.id}',
            action_label='View expense',
            related_expense=expense,
        )
    """
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
 
 