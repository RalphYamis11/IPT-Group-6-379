from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Student, Subject, Section, Enrollment
from .serializers import (
    StudentSerializer,
    SubjectSerializer,
    SectionSerializer,
    EnrollmentSerializer,
    EnrollmentSummarySerializer,
)


# ─── Student Views ──────────────────────────────────────────────────
class StudentListCreateView(generics.ListCreateAPIView):
    """
    List and create active students.
    """
    queryset = Student.objects.filter(is_active=True).order_by('student_id')
    serializer_class = StudentSerializer


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a student.
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


# ─── Subject Views ──────────────────────────────────────────────────
class SubjectListCreateView(generics.ListCreateAPIView):
    """
    List and create active subjects.
    """
    queryset = Subject.objects.filter(is_active=True).order_by('subject_code')
    serializer_class = SubjectSerializer


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a subject.
    """
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# ─── Section Views ──────────────────────────────────────────────────
class SectionListCreateView(generics.ListCreateAPIView):
    """
    List and create active sections.
    Supports filtering by subject.
    """
    queryset = Section.objects.filter(is_active=True).select_related(
        'subject'
    ).order_by('section_name')
    serializer_class = SectionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset


class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a section.
    """
    queryset = Section.objects.all().select_related('subject')
    serializer_class = SectionSerializer


# ─── Enrollment Views ────────────────────────────────────────────────
class EnrollmentListCreateView(generics.ListCreateAPIView):
    """
    List and create enrollments.
    Supports filtering by student, section, subject, and status.
    """
    queryset = Enrollment.objects.select_related(
        'student', 'section__subject'
    ).order_by('-enrolled_at')
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student')
        section_id = self.request.query_params.get('section')
        subject_id = self.request.query_params.get('subject')
        status_filter = self.request.query_params.get('status')

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if subject_id:
            queryset = queryset.filter(section__subject_id=subject_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Student successfully enrolled.',
                    'enrollment': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or drop an enrollment.
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Enrollment updated.',
                'enrollment': serializer.data
            })

        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'dropped'
        instance.save()

        return Response(
            {'message': f'Enrollment dropped for {instance.student.full_name}.'},
            status=status.HTTP_200_OK
        )


# ─── Enrollment Summary Views ────────────────────────────────────────
class EnrollmentSummaryListView(generics.ListAPIView):
    """
    List enrollment summaries for all students.
    """
    queryset = Student.objects.prefetch_related(
        'enrollments__section__subject'
    ).order_by('student_id')
    serializer_class = EnrollmentSummarySerializer


class StudentEnrollmentSummaryView(generics.RetrieveAPIView):
    """
    Retrieve enrollment summary for a single student.
    """
    queryset = Student.objects.prefetch_related(
        'enrollments__section__subject'
    )
    serializer_class = EnrollmentSummarySerializer


# ─── Dashboard Stats View ─────────────────────────────────────────────
@api_view(['GET'])
def dashboard_stats(request):
    """
    Returns dashboard statistics including subject type breakdown.
    """
    total_students = Student.objects.count()
    total_subjects = Subject.objects.count()
    total_sections = Section.objects.count()
    total_enrollments = Enrollment.objects.filter(status='enrolled').count()

    full_sections = sum(1 for s in Section.objects.all() if s.is_full)

    subject_type_breakdown = {}
    enrollments = Enrollment.objects.filter(
        status='enrolled'
    ).select_related('section__subject')

    for enrollment in enrollments:
        subject_type = enrollment.section.subject.subject_type
        subject_type_breakdown[subject_type] = (
            subject_type_breakdown.get(subject_type, 0) + 1
        )

    return Response({
        'total_students': total_students,
        'total_subjects': total_subjects,
        'total_sections': total_sections,
        'active_enrollments': total_enrollments,
        'full_sections': full_sections,
        'subject_type_breakdown': subject_type_breakdown,
    })


# ─── API Root ─────────────────────────────────────────────────────────
@api_view(['GET'])
def api_root(request):
    """
    API root endpoint.
    """
    return Response({
        'message': 'Student Enrollment & Sectioning System API',
        'version': '1.0',
        'endpoints': {
            'dashboard': request.build_absolute_uri('dashboard/'),
            'students': request.build_absolute_uri('students/'),
            'subjects': request.build_absolute_uri('subjects/'),
            'sections': request.build_absolute_uri('sections/'),
            'enrollments': request.build_absolute_uri('enrollments/'),
            'summaries': request.build_absolute_uri('summaries/'),
        }
    })