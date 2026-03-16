from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models.base import Team, Employee, Category
from api.models.support import FAQ, Document, SupportStat
import random

class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Create teams
        teams_data = [
            {'name': 'Marketing', 'description': 'Marketing and Communications'},
            {'name': 'Sales', 'description': 'Sales and Business Development'},
            {'name': 'Finance', 'description': 'Finance and Accounting'},
            {'name': 'Engineering', 'description': 'Software Development'},
            {'name': 'HR', 'description': 'Human Resources'},
        ]
        
        for team_data in teams_data:
            team, created = Team.objects.get_or_create(
                name=team_data['name'],
                defaults={'description': team_data['description']}
            )
            if created:
                self.stdout.write(f'  Created team: {team.name}')

        # Create admin user if not exists
        if not User.objects.filter(email='admin@example.com').exists():
            admin_user = User.objects.create_superuser(
                username='admin@example.com',
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            
            admin_employee = Employee.objects.create(
                user=admin_user,
                employee_id='EMP0001',
                department='Administration',
                position='System Administrator',
                role='admin',
                is_active=True
            )
            self.stdout.write('  Created admin user')

        # Create sample manager
        if not User.objects.filter(email='manager@example.com').exists():
            manager_user = User.objects.create_user(
                username='manager@example.com',
                email='manager@example.com',
                password='manager123',
                first_name='Manager',
                last_name='User'
            )
            
            manager_team = Team.objects.filter(name='Sales').first()
            manager_employee = Employee.objects.create(
                user=manager_user,
                employee_id='EMP0002',
                department='Sales',
                team=manager_team,
                position='Sales Manager',
                role='manager',
                is_active=True
            )
            self.stdout.write('  Created manager user')

        # Create sample employee
        if not User.objects.filter(email='employee@example.com').exists():
            employee_user = User.objects.create_user(
                username='employee@example.com',
                email='employee@example.com',
                password='employee123',
                first_name='Employee',
                last_name='User'
            )
            
            employee_team = Team.objects.filter(name='Marketing').first()
            employee_employee = Employee.objects.create(
                user=employee_user,
                employee_id=f'EMP{random.randint(1000, 9999)}',
                department='Marketing',
                team=employee_team,
                position='Marketing Specialist',
                role='employee',
                is_active=True
            )
            self.stdout.write('  Created employee user')

        # Create categories
        categories_data = [
            {'name': 'Office Supplies', 'code': 'OFFICE', 'description': 'Stationery, printer supplies'},
            {'name': 'Travel', 'code': 'TRAVEL', 'description': 'Flights, trains, taxis'},
            {'name': 'Meals', 'code': 'MEALS', 'description': 'Business meals, client entertainment'},
            {'name': 'Software', 'code': 'SOFTWARE', 'description': 'Software subscriptions'},
            {'name': 'Hardware', 'code': 'HARDWARE', 'description': 'Laptops, monitors'},
            {'name': 'Training', 'code': 'TRAINING', 'description': 'Courses, certifications'},
            {'name': 'Marketing', 'code': 'MARKETING', 'description': 'Ads, promotions'},
            {'name': 'Other', 'code': 'OTHER', 'description': 'Miscellaneous'},
        ]
        
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                code=cat_data['code'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))