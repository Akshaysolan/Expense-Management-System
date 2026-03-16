from django.db import models
from django.contrib.auth.models import User
import uuid

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
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='generated_reports'
    )
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ['-created_at']
 
    def __str__(self):
        return f"{self.title} ({self.report_id})"