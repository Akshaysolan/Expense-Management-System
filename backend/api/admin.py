from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Team, Employee, Category, Expense, Trip, PDFUpload
from .models import Report

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

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'team', 'position', 'role', 'is_active']
    list_filter = ['department', 'team', 'role', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__email']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    search_fields = ['name', 'code']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['subject', 'amount', 'employee', 'date', 'status']
    list_filter = ['status', 'category', 'team', 'date']
    search_fields = ['subject', 'description']

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['destination', 'employee', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date']
    search_fields = ['destination', 'purpose']

@admin.register(PDFUpload)
class PDFUploadAdmin(admin.ModelAdmin):
    list_display = ['id', 'processed', 'expenses_found', 'uploaded_at', 'uploaded_by']

# Support app admin registrations
from django.contrib import admin
from .models import (
    FAQ, Document, SupportTicket, TicketReply, 
    LiveChatSession, ChatMessage, FAQFeedback, 
    SupportStat, VideoBooking
)

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'tag', 'order', 'is_active', 'created_at']
    list_filter = ['tag', 'is_active']
    search_fields = ['question', 'answer']
    list_editable = ['order', 'is_active']

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    list_editable = ['order', 'is_active']

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

@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_staff_reply', 'created_at']
    list_filter = ['is_staff_reply', 'created_at']
    search_fields = ['message']

@admin.register(LiveChatSession)
class LiveChatSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'visitor_name', 'status', 'created_at', 'ended_at']
    list_filter = ['status', 'created_at']
    search_fields = ['session_id', 'visitor_name', 'visitor_email']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'sender_type', 'message', 'created_at']
    list_filter = ['sender_type', 'created_at']

@admin.register(FAQFeedback)
class FAQFeedbackAdmin(admin.ModelAdmin):
    list_display = ['faq', 'is_helpful', 'created_at']
    list_filter = ['is_helpful', 'created_at']

@admin.register(SupportStat)
class SupportStatAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'suffix', 'label', 'updated_at']

@admin.register(VideoBooking)
class VideoBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'name', 'email', 'preferred_date', 'preferred_time', 'status']
    list_filter = ['status', 'preferred_date']
    search_fields = ['booking_id', 'name', 'email', 'topic']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        'report_id', 'title', 'report_type', 'format',
        'status', 'date_range_start', 'date_range_end',
        'generated_by', 'created_at',
    ]
    list_filter  = ['report_type', 'format', 'status', 'created_at']
    search_fields = ['title', 'report_id']
    readonly_fields = ['report_id', 'created_at', 'updated_at']