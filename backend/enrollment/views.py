from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Student, Subject, Section, Enrollment
from .serializers import (
    StudentSerializer, SubjectSerializer, SectionSerializer,
    EnrollmentSerializer, EnrollmentSummarySerializer
)


@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'Student Enrollment & Sectioning System API',
        'version': '1.0',
        'endpoints': {
            'dashboard':   request.build_absolute_uri('dashboard/'),
            'students':    request.build_absolute_uri('students/'),
            'subjects':    request.build_absolute_uri('subjects/'),
            'sections':    request.build_absolute_uri('sections/'),
            'enrollments': request.build_absolute_uri('enrollments/'),
            'summaries':   request.build_absolute_uri('summaries/'),
        }
    })


# ─── Student Views ─────────────────────────────────────────────────
class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer

    def get_queryset(self):
        queryset = Student.objects.all().order_by('student_id')
        search     = self.request.query_params.get('search')
        year_level = self.request.query_params.get('year_level')
        course     = self.request.query_params.get('course')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(student_id__icontains=search) |
                Q(email__icontains=search)
            )
        if year_level:
            queryset = queryset.filter(year_level=int(year_level))
        if course:
            queryset = queryset.filter(course__icontains=course)
        return queryset


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


# ─── Subject Views ─────────────────────────────────────────────────
class SubjectListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        queryset = Subject.objects.all().order_by('subject_code')
        subject_type = self.request.query_params.get('type')
        search       = self.request.query_params.get('search')
        if subject_type:
            queryset = queryset.filter(subject_type=subject_type)
        if search:
            queryset = queryset.filter(
                Q(subject_code__icontains=search) | Q(name__icontains=search)
            )
        return queryset


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# ─── Section Views ─────────────────────────────────────────────────
class SectionListCreateView(generics.ListCreateAPIView):
    serializer_class = SectionSerializer

    def get_queryset(self):
        queryset   = Section.objects.all().select_related('subject').order_by('subject__subject_code', 'section_name')
        subject_id = self.request.query_params.get('subject')
        instructor = self.request.query_params.get('instructor')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if instructor:
            queryset = queryset.filter(instructor__icontains=instructor)
        return queryset


class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Section.objects.all().select_related('subject')
    serializer_class = SectionSerializer


# ─── Enrollment Views ───────────────────────────────────────────────
class EnrollmentListCreateView(generics.ListCreateAPIView):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        queryset      = Enrollment.objects.all().select_related('student', 'section__subject').order_by('-enrolled_at')
        student_id    = self.request.query_params.get('student')
        section_id    = self.request.query_params.get('section')
        status_filter = self.request.query_params.get('status')
        subject_id    = self.request.query_params.get('subject')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if subject_id:
            queryset = queryset.filter(section__subject_id=subject_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Student successfully enrolled.', 'enrollment': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Enrollment updated.', 'enrollment': serializer.data})
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'dropped'
        instance.save()
        return Response(
            {'message': f'Enrollment dropped for {instance.student.full_name}.'},
            status=status.HTTP_200_OK
        )


# ─── Summary Views ──────────────────────────────────────────────────
class EnrollmentSummaryListView(generics.ListAPIView):
    serializer_class = EnrollmentSummarySerializer

    def get_queryset(self):
        queryset = Student.objects.prefetch_related('enrollments__section__subject').order_by('student_id')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(student_id__icontains=search)
            )
        return queryset


class StudentEnrollmentSummaryView(generics.RetrieveAPIView):
    queryset = Student.objects.prefetch_related('enrollments__section__subject')
    serializer_class = EnrollmentSummarySerializer


# ─── Dashboard ──────────────────────────────────────────────────────
@api_view(['GET'])
def dashboard_stats(request):
    total_students  = Student.objects.count()
    total_subjects  = Subject.objects.count()
    total_sections  = Section.objects.count()
    active_enroll   = Enrollment.objects.filter(status='enrolled').count()
    dropped_enroll  = Enrollment.objects.filter(status='dropped').count()
    full_sections   = sum(1 for s in Section.objects.all() if s.is_full)
    avail_sections  = total_sections - full_sections

    year_breakdown = {f'year_{i}': Student.objects.filter(year_level=i).count() for i in range(1, 5)}

    type_breakdown = {t: Subject.objects.filter(subject_type=t).count() for t in ['lecture', 'lab', 'pe', 'nstp']}

    return Response({
        'total_students':       total_students,
        'total_subjects':       total_subjects,
        'total_sections':       total_sections,
        'active_enrollments':   active_enroll,
        'dropped_enrollments':  dropped_enroll,
        'full_sections':        full_sections,
        'available_sections':   avail_sections,
        'year_breakdown':       year_breakdown,
        'subject_type_breakdown': type_breakdown,
    })
