from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ========== AUTHENTICATION ==========
    path('auth/register/', views.register, name='auth-register'),
    path('auth/login/', views.login, name='auth-login'),
    path('auth/logout/', views.logout, name='auth-logout'),
    path('auth/profile/', views.profile, name='auth-profile'),
    path('auth/profile/update/', views.update_profile, name='auth-profile-update'),
    path('auth/change-password/', views.change_password, name='auth-change-password'),
    path('auth/token/refresh/', views.refresh_token, name='token-refresh'),
    
    # ========== DASHBOARD ==========
    path('dashboard/', views.dashboard, name='dashboard'),
    path('upload-pdf/', views.upload_pdf, name='upload-pdf'),
    
    # ========== EXPENSES ==========
    path('expenses/', views.expense_list, name='expense-list'),
    path('expenses/<uuid:pk>/', views.expense_detail, name='expense-detail'),
    path('expenses/stats/', views.expense_stats, name='expense-stats'),
    
    # ========== TRIPS ==========
    path('trips/', views.trip_list, name='trip-list'),
    path('trips/<uuid:pk>/', views.trip_detail, name='trip-detail'),
    path('trips/stats/', views.trip_stats, name='trip-stats'),
    
    # ========== EMPLOYEES ==========
    path('employees/', views.employee_list, name='employee-list'),
    path('employees/<int:pk>/', views.employee_detail, name='employee-detail'),
    
    # ========== TEAMS ==========
    path('teams/', views.team_list, name='team-list'),
    path('teams/<int:pk>/', views.team_detail, name='team-detail'),
    
    # ========== CATEGORIES ==========
    path('categories/', views.category_list, name='category-list'),
    
    # ========== SEARCH ==========
    path('search/', views.search, name='search'),
    
    # ========== REPORTS ==========
    path('reports/', views.generate_report, name='generate-report'),
    
    # ========== SUPPORT ==========
    path('faqs/', views.FAQListView.as_view(), name='faq-list'),
    path('documents/', views.DocumentListView.as_view(), name='document-list'),
    path('stats/', views.SupportStatListView.as_view(), name='stat-list'),
    
    # Support tickets
    path('tickets/', views.CreateSupportTicketView.as_view(), name='create-ticket'),
    path('tickets/<str:ticket_id>/', views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<str:ticket_id>/replies/', views.AddTicketReplyView.as_view(), name='add-reply'),
    
    # Live chat
    path('chat/sessions/', views.create_chat_session, name='create-chat'),
    path('chat/sessions/<str:session_id>/messages/', views.get_chat_messages, name='get-messages'),
    path('chat/sessions/<str:session_id>/send/', views.send_chat_message, name='send-message'),
    path('chat/sessions/<str:session_id>/close/', views.close_chat_session, name='close-chat'),
    
    # Feedback and interactions
    path('faq/feedback/', views.faq_feedback, name='faq-feedback'),
    path('video/book/', views.book_video_call, name='book-video'),
    path('stats/realtime/', views.get_support_stats, name='realtime-stats'),
    path('subscribe/', views.subscribe_to_updates, name='subscribe'),
    
]