# backend/api/management/commands/init_data.py
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Team, Employee, Category, Expense, Trip, PendingTask
from datetime import datetime, timedelta
import random
import uuid

class Command(BaseCommand):
    help = 'Initialize database with sample data'
    
    def handle(self, *args, **kwargs):
        # Clear existing data
        Expense.objects.all().delete()
        Trip.objects.all().delete()
        PendingTask.objects.all().delete()
        Employee.objects.all().delete()
        Team.objects.all().delete()
        Category.objects.all().delete()
        
        self.stdout.write('Creating sample data...')
        
        # Create sample teams
        teams = []
        team_names = ['Marketing', 'Sales', 'Finance', 'Engineering', 'HR']
        for name in team_names:
            team = Team.objects.create(
                name=name,
                description=f'{name} Department Team'
            )
            teams.append(team)
            self.stdout.write(f'Created team: {name}')
        
        # Create sample categories
        categories = []
        category_data = [
            {'name': 'Office Supplies', 'code': 'OFFICE', 'description': 'Office supplies and stationery'},
            {'name': 'Travel', 'code': 'TRAVEL', 'description': 'Travel expenses including flights and hotels'},
            {'name': 'Meals', 'code': 'MEALS', 'description': 'Business meals and entertainment'},
            {'name': 'Software', 'code': 'SOFTWARE', 'description': 'Software subscriptions and licenses'},
            {'name': 'Hardware', 'code': 'HARDWARE', 'description': 'Computer hardware and equipment'},
        ]
        for cat_data in category_data:
            category = Category.objects.create(**cat_data)
            categories.append(category)
            self.stdout.write(f'Created category: {cat_data["name"]}')
        
        # Create sample users and employees
        employees = []
        employee_data = [
            {'first_name': 'John', 'last_name': 'Smith', 'email': 'john.smith@example.com', 'role': 'employee', 'team': 'Marketing', 'position': 'Marketing Specialist'},
            {'first_name': 'Sarah', 'last_name': 'Jade', 'email': 'sarah.jade@example.com', 'role': 'manager', 'team': 'Sales', 'position': 'Sales Manager'},
            {'first_name': 'Mark', 'last_name': 'Brown', 'email': 'mark.brown@example.com', 'role': 'employee', 'team': 'Sales', 'position': 'Sales Representative'},
            {'first_name': 'Jennifer', 'last_name': 'Lee', 'email': 'jennifer.lee@example.com', 'role': 'employee', 'team': 'Marketing', 'position': 'Marketing Coordinator'},
            {'first_name': 'David', 'last_name': 'Wilson', 'email': 'david.wilson@example.com', 'role': 'finance', 'team': 'Finance', 'position': 'Finance Analyst'},
        ]
        
        for emp_data in employee_data:
            # Create user
            user = User.objects.create_user(
                username=emp_data['email'],
                email=emp_data['email'],
                password='password123',
                first_name=emp_data['first_name'],
                last_name=emp_data['last_name']
            )
            
            # Get team
            team = Team.objects.get(name=emp_data['team'])
            
            # Generate unique employee ID
            employee_id = f"EMP{random.randint(1000, 9999)}"
            while Employee.objects.filter(employee_id=employee_id).exists():
                employee_id = f"EMP{random.randint(1000, 9999)}"
            
            # Create employee profile
            employee = Employee.objects.create(
                user=user,
                employee_id=employee_id,
                department=emp_data['team'],
                team=team,
                position=emp_data['position'],
                role=emp_data['role'],
                phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                hire_date=datetime.now().date() - timedelta(days=random.randint(30, 365))
            )
            employees.append(employee)
            self.stdout.write(f'Created employee: {emp_data["first_name"]} {emp_data["last_name"]}')
        
        # Create sample expenses
        expense_statuses = ['pending', 'approved', 'rejected']
        
        sample_expenses = [
            {'subject': 'Office Supplies', 'amount': 150.00, 'description': 'Pens, paper, and folders'},
            {'subject': 'Business Lunch', 'amount': 75.50, 'description': 'Lunch with client'},
            {'subject': 'Travel Expenses', 'amount': 450.25, 'description': 'Flight to conference'},
            {'subject': 'Client Dinner', 'amount': 120.00, 'description': 'Dinner with potential client'},
            {'subject': 'Hotel', 'amount': 275.75, 'description': 'Hotel stay for business trip'},
            {'subject': 'Software License', 'amount': 299.99, 'description': 'Annual software subscription'},
            {'subject': 'Conference Tickets', 'amount': 399.00, 'description': 'Industry conference tickets'},
            {'subject': 'Taxi Fare', 'amount': 45.00, 'description': 'Transportation to meeting'},
        ]
        
        for i, expense_data in enumerate(sample_expenses):
            employee = random.choice(employees)
            team = employee.team
            category = random.choice(categories)
            status = random.choice(expense_statuses)
            
            # Create date within last 30 days
            expense_date = datetime.now().date() - timedelta(days=random.randint(0, 30))
            
            expense = Expense.objects.create(
                subject=expense_data['subject'],
                description=expense_data['description'],
                amount=expense_data['amount'],
                date=expense_date,
                employee=employee,
                team=team,
                category=category,
                status=status
            )
            self.stdout.write(f'Created expense: {expense.subject} - ${expense.amount}')
        
        # Create sample trips
        trip_statuses = ['pending', 'approved', 'rejected', 'completed']
        destinations = ['New York', 'Chicago', 'Los Angeles', 'Miami', 'Boston', 'Seattle']
        
        for i in range(5):
            employee = random.choice(employees)
            start_date = datetime.now().date() + timedelta(days=random.randint(-10, 20))
            end_date = start_date + timedelta(days=random.randint(1, 5))
            status = random.choice(trip_statuses)
            
            trip = Trip.objects.create(
                destination=random.choice(destinations),
                purpose=f'Business meeting and client visits',
                employee=employee,
                start_date=start_date,
                end_date=end_date,
                estimated_expenses=random.uniform(500, 2000),
                actual_expenses=random.uniform(400, 1800) if status in ['completed', 'approved'] else 0,
                status=status
            )
            self.stdout.write(f'Created trip: {trip.destination} for {employee.user.get_full_name()}')
        
        # Create pending tasks
        tasks = [
            {'task_type': 'printing', 'count': 5},
            {'task_type': 'trips', 'count': Expense.objects.filter(status='pending').count()},
            {'task_type': 'unreported', 'count': 4},
            {'task_type': 'upcoming', 'count': 2},
            {'task_type': 'advances', 'count': 0, 'value': 0.00},
        ]
        
        for task_data in tasks:
            PendingTask.objects.create(**task_data)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized database with:\n'
                f'  - {Team.objects.count()} teams\n'
                f'  - {Category.objects.count()} categories\n'
                f'  - {Employee.objects.count()} employees\n'
                f'  - {Expense.objects.count()} expenses\n'
                f'  - {Trip.objects.count()} trips\n'
                f'  - {PendingTask.objects.count()} tasks'
            )
        )