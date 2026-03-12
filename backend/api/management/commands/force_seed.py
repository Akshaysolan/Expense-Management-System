# backend/api/management/commands/force_seed.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import FAQ, Document, SupportStat
import sys

User = get_user_model()

class Command(BaseCommand):
    help = 'Force seed initial support data even if it exists'

    def handle(self, *args, **options):
        self.stdout.write('Starting force seed...')
        
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        FAQ.objects.all().delete()
        Document.objects.all().delete()
        SupportStat.objects.all().delete()
        
        # Seed FAQs
        self.stdout.write('Seeding FAQs...')
        faqs = [
            {
                'question': 'How do I submit an expense report?',
                'answer': 'Navigate to the Expenses page and click "Add Expense". Fill in the required details — amount, category, date, and description — then attach a receipt photo if required. Submit for manager approval. You can track status under My Expenses.',
                'tag': 'Expenses',
                'order': 1
            },
            {
                'question': 'How are approvals processed?',
                'answer': 'Once submitted, expense and trip requests route to your direct manager. Managers receive in-app notifications and email alerts. You can monitor live status in the Approvals page. Approved expenses are reimbursed in the next payroll cycle.',
                'tag': 'Approvals',
                'order': 2
            },
            {
                'question': 'Can I export my expense data?',
                'answer': 'Yes. On the Expenses page, click the Export button and choose CSV or Excel format. You can also generate formatted PDF reports from the Reports page, filtered by date range, category, or status.',
                'tag': 'Reports',
                'order': 3
            },
            {
                'question': 'How do I create a trip request?',
                'answer': 'Go to the Trips page and click "New Trip". Enter your destination, travel dates, purpose, and estimated expenses. Once submitted, your manager will review and approve it. You can then log expenses directly against the approved trip.',
                'tag': 'Trips',
                'order': 4
            },
            {
                'question': 'What happens to unreported expenses?',
                'answer': 'Unreported expenses appear as pending tasks on your dashboard. You should submit them within 30 days to ensure timely reimbursement. Expenses older than 90 days may require additional documentation and manager sign-off.',
                'tag': 'Expenses',
                'order': 5
            },
            {
                'question': 'How do I change my password or update my profile?',
                'answer': 'Click your avatar in the top-right corner and select Profile, or go to Settings → Account. From there you can update your name, contact info, department, and change your password. Changes take effect immediately.',
                'tag': 'Account',
                'order': 6
            },
            {
                'question': 'Why was my expense rejected?',
                'answer': 'Rejections include a reason from your manager, visible in the Approvals page and your notification feed. Common reasons include missing receipts, policy limit exceeded, or incorrect category. You can edit and resubmit directly from the expense detail page.',
                'tag': 'Approvals',
                'order': 7
            },
            {
                'question': 'Is there a mobile app available?',
                'answer': 'ExpensePro is fully responsive and works on any mobile browser. A dedicated iOS and Android app is on our roadmap — subscribe to our changelog to be notified on launch.',
                'tag': 'General',
                'order': 8
            }
        ]
        
        for faq_data in faqs:
            FAQ.objects.create(**faq_data)
            self.stdout.write(f'  Created FAQ: {faq_data["question"][:30]}...')
        
        # Seed Documents
        self.stdout.write('Seeding Documents...')
        docs = [
            {
                'title': 'Getting Started Guide',
                'icon': '🚀',
                'description': 'Set up your account and submit your first expense',
                'external_url': '#',
                'order': 1
            },
            {
                'title': 'Expense Policy Overview',
                'icon': '📋',
                'description': 'Understand company spending limits and categories',
                'external_url': '#',
                'order': 2
            },
            {
                'title': 'Trip & Travel Handbook',
                'icon': '✈️',
                'description': 'Everything about booking trips and travel expenses',
                'external_url': '#',
                'order': 3
            },
            {
                'title': 'Approval Workflow Guide',
                'icon': '✅',
                'description': 'How approvals work for managers and finance teams',
                'external_url': '#',
                'order': 4
            },
            {
                'title': 'Reports & Analytics Manual',
                'icon': '📊',
                'description': 'Generate and interpret expense reports',
                'external_url': '#',
                'order': 5
            },
            {
                'title': 'Admin Configuration Guide',
                'icon': '⚙️',
                'description': 'Setting up teams, categories, and policy rules',
                'external_url': '#',
                'order': 6
            }
        ]
        
        for doc_data in docs:
            Document.objects.create(**doc_data)
            self.stdout.write(f'  Created Document: {doc_data["title"]}')
        
        # Seed Stats
        self.stdout.write('Seeding Stats...')
        stats = [
            {'name': 'satisfaction', 'value': '98', 'suffix': '%', 'label': 'Satisfaction rate'},
            {'name': 'response_time', 'value': '2', 'suffix': 'h', 'label': 'Avg. response time'},
            {'name': 'chat_available', 'value': '24', 'suffix': '/7', 'label': 'Live chat available'},
            {'name': 'issues_resolved', 'value': '50', 'suffix': 'k+', 'label': 'Issues resolved'},
        ]
        
        for stat_data in stats:
            SupportStat.objects.create(**stat_data)
            self.stdout.write(f'  Created Stat: {stat_data["name"]}')
        
        # Verify data was created
        faq_count = FAQ.objects.count()
        doc_count = Document.objects.count()
        stat_count = SupportStat.objects.count()
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded: {faq_count} FAQs, {doc_count} Documents, {stat_count} Stats'))