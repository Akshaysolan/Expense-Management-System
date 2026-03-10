from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Team, Employee, Category, Expense, Trip, PDFUpload

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