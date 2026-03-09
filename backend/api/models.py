# backend/api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('office', 'Office Supplies'),
        ('lunch', 'Business Lunch'),
        ('travel', 'Travel Expenses'),
        ('dinner', 'Client Dinner'),
        ('hotel', 'Hotel'),
        ('software', 'Software'),
        ('hardware', 'Hardware'),
        ('other', 'Other'),
    ]
    
    TEAM_CHOICES = [
        ('Sales', 'Sales'),
        ('Marketing', 'Marketing'),
        ('Finance', 'Finance'),
        ('IT', 'IT'),
        ('HR', 'HR'),
        ('General', 'General'),
    ]
    
    subject = models.CharField(max_length=200)
    employee = models.CharField(max_length=100)
    team = models.CharField(max_length=50, choices=TEAM_CHOICES, default='General')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.subject} - €{self.amount}"

class PendingTask(models.Model):
    TASK_TYPES = [
        ('printing', 'Printing Approvals'),
        ('trips', 'New Trips Registered'),
        ('unreported', 'Unreported Expenses'),
        ('upcoming', 'Upcoming Expenses'),
        ('advances', 'Unreported Advances'),
    ]
    
    task_type = models.CharField(max_length=50, choices=TASK_TYPES, unique=True)
    count = models.IntegerField(default=0)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_task_type_display()}: {self.count}"

class UploadedPDF(models.Model):
    file = models.FileField(upload_to='pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    expenses_found = models.IntegerField(default=0)
    
    def __str__(self):
        return f"PDF uploaded at {self.uploaded_at}"