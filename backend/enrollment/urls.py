from django.urls import path
from . import views

urlpatterns = [
    # Root
    path('', views.api_root, name='api-root'),

    # Dashboard
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),

    # Students
    path('students/', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),

    # Subjects
    path('subjects/', views.SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),

    # Sections
    path('sections/', views.SectionListCreateView.as_view(), name='section-list-create'),
    path('sections/<int:pk>/', views.SectionDetailView.as_view(), name='section-detail'),

    # Enrollments
    path('enrollments/', views.EnrollmentListCreateView.as_view(), name='enrollment-list-create'),
    path('enrollments/<int:pk>/', views.EnrollmentDetailView.as_view(), name='enrollment-detail'),

    # Summaries
    path('summaries/', views.EnrollmentSummaryListView.as_view(), name='enrollment-summary-list'),
    path('summaries/<int:pk>/', views.StudentEnrollmentSummaryView.as_view(), name='student-enrollment-summary'),
]