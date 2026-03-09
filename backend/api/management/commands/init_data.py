# backend/api/management/commands/init_data.py
import os
from django.core.management.base import BaseCommand
from api.models import Expense, PendingTask
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Initialize database with sample data'
    
    def handle(self, *args, **kwargs):
        # Clear existing data
        Expense.objects.all().delete()
        PendingTask.objects.all().delete()
        
        # Sample expense data
        sample_expenses = [
            {'subject': 'Office Supplies', 'employee': 'John Smith', 'team': 'Marketing', 'amount': 150.00, 'category': 'office'},
            {'subject': 'Business Lunch', 'employee': 'Sarah Jade', 'team': 'Sales', 'amount': 75.50, 'category': 'lunch'},
            {'subject': 'Travel Expenses', 'employee': 'Mark Brown', 'team': 'Sales', 'amount': 450.25, 'category': 'travel'},
            {'subject': 'Client Dinner', 'employee': 'Jennifer Lee', 'team': 'Marketing', 'amount': 120.00, 'category': 'dinner'},
            {'subject': 'Hotel', 'employee': 'David Wilson', 'team': 'Finance', 'amount': 275.75, 'category': 'hotel'},
        ]
        
        for expense_data in sample_expenses:
            Expense.objects.create(**expense_data)
        
        # Create pending tasks
        tasks = [
            {'task_type': 'printing', 'count': 5},
            {'task_type': 'trips', 'count': 1},
            {'task_type': 'unreported', 'count': 4},
            {'task_type': 'upcoming', 'count': 0},
            {'task_type': 'advances', 'count': 0, 'value': 0.00},
        ]
        
        for task_data in tasks:
            PendingTask.objects.create(**task_data)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized database with {Expense.objects.count()} expenses '
                f'and {PendingTask.objects.count()} tasks'
            )
        )