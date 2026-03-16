from django.urls import path
from django.http import JsonResponse
from . import views

def home(request):
    return JsonResponse({"message": "Expense Management API Running"})

urlpatterns = [
    path('', home, name='api-home'),
    
    # ========== AUTHENTICATION ==========
    path('auth/register/', views.auth_views.register, name='auth-register'),
    path('auth/login/', views.auth_views.login, name='auth-login'),
    path('auth/logout/', views.auth_views.logout, name='auth-logout'),
    path('auth/profile/', views.auth_views.profile, name='auth-profile'),
    path('auth/profile/update/', views.auth_views.update_profile, name='auth-profile-update'),
    path('auth/change-password/', views.auth_views.change_password, name='auth-change-password'),
    path('auth/token/refresh/', views.auth_views.refresh_token, name='token-refresh'),
    path('auth/forgot-password/', views.auth_views.forgot_password, name='auth-forgot-password'),
    path('auth/reset-password/', views.auth_views.reset_password, name='auth-reset-password'),
    path('auth/verify-email/', views.auth_views.verify_email, name='auth-verify-email'),
    path('auth/delete-account/', views.auth_views.delete_account, name='auth-delete-account'),

    # ========== DASHBOARD ==========
    path('dashboard/', views.dashboard_views.dashboard, name='dashboard'),
    path('pending-tasks/', views.dashboard_views.pending_tasks, name='pending-tasks'),

    # ========== EXPENSES ==========
    path('expenses/', views.expense_views.expense_list, name='expense-list'),
    path('expenses/<uuid:pk>/', views.expense_views.expense_detail, name='expense-detail'),
    path('expenses/stats/', views.expense_views.expense_stats, name='expense-stats'),

    # ========== TRIPS ==========
    path('trips/', views.trip_views.trip_list, name='trip-list'),
    path('trips/<uuid:pk>/', views.trip_views.trip_detail, name='trip-detail'),
    path('trips/stats/', views.trip_views.trip_stats, name='trip-stats'),

    # ========== EMPLOYEES ==========
    path('employees/', views.employee_views.employee_list, name='employee-list'),
    path('employees/<int:pk>/', views.employee_views.employee_detail, name='employee-detail'),

    # ========== TEAMS ==========
    path('teams/', views.team_views.team_list, name='team-list'),
    path('teams/<int:pk>/', views.team_views.team_detail, name='team-detail'),

    # ========== CATEGORIES ==========
    path('categories/', views.category_views.category_list, name='category-list'),

    # ========== SEARCH ==========
    path('search/', views.search_views.search, name='search'),

    # ========== PDF UPLOADS ==========
    path('upload-pdf/', views.pdf_views.upload_pdf, name='upload-pdf'),
    path('pdf-history/', views.pdf_views.pdf_history, name='pdf-history'),
    path('pdf-analytics/<int:pdf_id>/', views.pdf_views.pdf_analytics_detail, name='pdf-analytics-detail'),

    # ========== REPORTS ==========
    path('reports/recent/', views.report_views.recent_reports, name='reports-recent'),
    path('reports/generate/', views.report_views.generate_report, name='reports-generate'),
    path('reports/download/<uuid:report_id>/', views.report_views.download_report, name='reports-download'),

    # ========== NOTIFICATIONS ==========
    path('notifications/', views.notification_views.notification_list, name='notification-list'),
    path('notifications/mark-all-read/', views.notification_views.notification_mark_all_read, name='notification-mark-all'),
    path('notifications/clear-all/', views.notification_views.notification_clear_all, name='notification-clear-all'),
    path('notifications/<uuid:pk>/read/', views.notification_views.notification_mark_read, name='notification-read'),
    path('notifications/<uuid:pk>/', views.notification_views.notification_delete, name='notification-delete'),

    # ========== MESSAGES ==========
    path('messages/', views.message_views.message_thread_list, name='message-list'),
    path('messages/threads/<uuid:pk>/', views.message_views.message_thread_detail, name='message-thread-detail'),
    path('messages/threads/<uuid:pk>/reply/', views.message_views.message_reply, name='message-reply'),
    path('messages/threads/<uuid:pk>/delete/', views.message_views.message_thread_delete, name='message-thread-delete'),
    path('messages/threads/<uuid:pk>/star/', views.message_views.message_thread_star, name='message-thread-star'),

    # ========== ANALYTICS ==========
    path('analytics/', views.analytics_views.analytics, name='analytics'),

    # ========== QUICK ACCESS ==========
    path('quick-access/', views.quick_access_views.quick_access_actions, name='quick-access'),
    path('quick-access/action/', views.quick_access_views.log_quick_access_action, name='log-quick-access'),

    # ========== SUPPORT ==========
    path('faqs/', views.support_views.FAQListView.as_view(), name='faq-list'),
    path('documents/', views.support_views.DocumentListView.as_view(), name='document-list'),
    path('support-stats/', views.support_views.SupportStatListView.as_view(), name='stat-list'),
    path('tickets/', views.support_views.CreateSupportTicketView.as_view(), name='create-ticket'),
    path('tickets/<str:ticket_id>/', views.support_views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<str:ticket_id>/replies/', views.support_views.AddTicketReplyView.as_view(), name='add-reply'),
    path('chat/sessions/', views.support_views.create_chat_session, name='create-chat'),
    path('chat/sessions/<str:session_id>/messages/', views.support_views.get_chat_messages, name='get-messages'),
    path('chat/sessions/<str:session_id>/send/', views.support_views.send_chat_message, name='send-message'),
    path('chat/sessions/<str:session_id>/close/', views.support_views.close_chat_session, name='close-chat'),
    path('faq/feedback/', views.support_views.faq_feedback, name='faq-feedback'),
    path('video/book/', views.support_views.book_video_call, name='book-video'),
    path('support-stats/realtime/', views.support_views.get_support_stats, name='realtime-stats'),
    path('subscribe/', views.support_views.subscribe_to_updates, name='subscribe'),
]