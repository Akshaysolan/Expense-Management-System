# backend/api/management/commands/check_data.py
from django.core.management.base import BaseCommand
from api.models import Employee, Expense, Trip

class Command(BaseCommand):
    help = 'Check database contents'
    
    def handle(self, *args, **kwargs):
        self.stdout.write(f"Employees: {Employee.objects.count()}")
        self.stdout.write(f"Expenses: {Expense.objects.count()}")
        self.stdout.write(f"Trips: {Trip.objects.count()}")
        
        expense = Expense.objects.first()
        if expense:
            self.stdout.write(f"\nSample expense: {expense.subject} - ${expense.amount}")
            self.stdout.write(f"Employee: {expense.employee}")
            self.stdout.write(f"Team: {expense.team}")
            self.stdout.write(f"Category: {expense.category}")