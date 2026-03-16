from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

# Fix the imports - PendingTask is in base.py, not expense.py
from .models.base import Team, Employee, Category, PendingTask
from .models.expense import Expense, PDFUpload
from .models.trip import Trip
from .models.support import FAQ, Document, SupportTicket, TicketReply, LiveChatSession, ChatMessage, FAQFeedback, SupportStat, VideoBooking
from .models.reports import Report
from .models.messaging import Notification, MessageThread, Message

# Employee Inline for User Admin
class EmployeeInline(admin.StackedInline):
    model = Employee
    can_delete = False
    verbose_name_plural = 'Employee Profile'

class CustomUserAdmin(UserAdmin):
    inlines = [EmployeeInline]
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_department')
    list_select_related = ('employee_profile',)
    
    def get_department(self, instance):
        return instance.employee_profile.department if hasattr(instance, 'employee_profile') else '-'
    get_department.short_description = 'Department'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Team Admin
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

# Employee Admin
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'team', 'position', 'role', 'is_active']
    list_filter = ['department', 'team', 'role', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__email']

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    search_fields = ['name', 'code']

# Expense Admin
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['subject', 'amount', 'employee', 'date', 'status']
    list_filter = ['status', 'category', 'team', 'date']
    search_fields = ['subject', 'description']

# Trip Admin
@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['destination', 'employee', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date']
    search_fields = ['destination', 'purpose']

# PDF Upload Admin
@admin.register(PDFUpload)
class PDFUploadAdmin(admin.ModelAdmin):
    list_display = ['id', 'processed', 'expenses_found', 'uploaded_at', 'uploaded_by']

# FAQ Admin
@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'tag', 'order', 'is_active', 'created_at']
    list_filter = ['tag', 'is_active']
    search_fields = ['question', 'answer']
    list_editable = ['order', 'is_active']

# Document Admin
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']

# Support Ticket Admin
@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'name', 'email', 'subject', 'priority', 'status', 'created_at']
    list_filter = ['priority', 'status', 'created_at']
    search_fields = ['ticket_id', 'name', 'email', 'subject', 'message']
    readonly_fields = ['ticket_id', 'created_at', 'updated_at']
    actions = ['mark_as_in_progress', 'mark_as_resolved']
    
    def mark_as_in_progress(self, request, queryset):
        queryset.update(status='in_progress')
    mark_as_in_progress.short_description = "Mark selected tickets as In Progress"
    
    def mark_as_resolved(self, request, queryset):
        queryset.update(status='resolved')
    mark_as_resolved.short_description = "Mark selected tickets as Resolved"

# Ticket Reply Admin
@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_staff_reply', 'created_at']
    list_filter = ['is_staff_reply', 'created_at']
    search_fields = ['message']

# Live Chat Session Admin
@admin.register(LiveChatSession)
class LiveChatSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'visitor_name', 'status', 'created_at', 'ended_at']
    list_filter = ['status', 'created_at']
    search_fields = ['session_id', 'visitor_name', 'visitor_email']

# Chat Message Admin
@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'sender_type', 'message', 'created_at']
    list_filter = ['sender_type', 'created_at']

# FAQ Feedback Admin
@admin.register(FAQFeedback)
class FAQFeedbackAdmin(admin.ModelAdmin):
    list_display = ['faq', 'is_helpful', 'created_at']
    list_filter = ['is_helpful', 'created_at']

# Support Stat Admin
@admin.register(SupportStat)
class SupportStatAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'suffix', 'label', 'updated_at']

# Video Booking Admin
@admin.register(VideoBooking)
class VideoBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'name', 'email', 'preferred_date', 'preferred_time', 'status']
    list_filter = ['status', 'preferred_date']
    search_fields = ['booking_id', 'name', 'email', 'topic']

# Report Admin
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_id', 'title', 'report_type', 'format', 'status', 'generated_by', 'created_at']
    list_filter = ['report_type', 'format', 'status', 'created_at']
    search_fields = ['title', 'report_id']
    readonly_fields = ['report_id', 'created_at', 'updated_at']

# Notification Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'recipient', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__email']
    readonly_fields = ['id', 'created_at']

# Message Thread Admin
@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ['subject', 'created_at', 'updated_at']
    search_fields = ['subject']

# Message Admin
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['thread', 'sender', 'created_at']
    list_filter = ['created_at']
    search_fields = ['body']