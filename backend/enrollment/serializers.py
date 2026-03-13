from rest_framework import serializers
from .models import Student, Subject, Section, Enrollment


class StudentSerializer(serializers.ModelSerializer):
    total_enrolled_units = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Student
        fields = ['id', 'student_id', 'first_name', 'last_name', 'full_name',
                  'email', 'total_enrolled_units', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_student_id(self, value):
        if not value.strip():
            raise serializers.ValidationError("Student ID cannot be blank.")
        return value.strip().upper()

    def validate_email(self, value):
        return value.strip().lower()


class SubjectSerializer(serializers.ModelSerializer):
    total_sections = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'subject_code', 'name', 'units', 'description',
                  'total_sections', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_total_sections(self, obj):
        return obj.sections.count()

    def validate_units(self, value):
        if value < 1 or value > 6:
            raise serializers.ValidationError("Units must be between 1 and 6.")
        return value

    def validate_subject_code(self, value):
        return value.strip().upper()


class SectionSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    enrolled_count = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()

    class Meta:
        model = Section
        fields = ['id', 'section_name', 'subject', 'subject_details',
                  'max_students', 'schedule', 'instructor',
                  'enrolled_count', 'available_slots', 'is_full', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_max_students(self, value):
        if value < 1:
            raise serializers.ValidationError("Max students must be at least 1.")
        return value


class EnrollmentSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'section', 'student_details',
                  'section_details', 'status', 'enrolled_at', 'updated_at']
        read_only_fields = ['id', 'enrolled_at', 'updated_at']

    def validate(self, data):
        student = data.get('student')
        section = data.get('section')

        # Check for duplicate enrollment (only on create)
        if self.instance is None:
            existing = Enrollment.objects.filter(
                student=student,
                section=section,
                status='enrolled'
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Student is already enrolled in this section."
                )

            # Check if student is already enrolled in same subject
            same_subject_enrollment = Enrollment.objects.filter(
                student=student,
                section__subject=section.subject,
                status='enrolled'
            ).exists()
            if same_subject_enrollment:
                raise serializers.ValidationError(
                    f"Student is already enrolled in another section of {section.subject.subject_code}."
                )

            # Check section capacity
            if section.is_full:
                raise serializers.ValidationError(
                    f"Section {section.section_name} is already full "
                    f"({section.max_students}/{section.max_students} students)."
                )

        return data


class EnrollmentSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_enrolled_units = serializers.ReadOnlyField()
    enrolled_subjects = serializers.SerializerMethodField()
    total_subjects = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'student_id', 'full_name', 'email',
                  'total_enrolled_units', 'total_subjects', 'enrolled_subjects']

    def get_enrolled_subjects(self, obj):
        enrollments = obj.enrollments.filter(status='enrolled').select_related(
            'section__subject'
        )
        return [
            {
                'enrollment_id': e.id,
                'subject_code': e.section.subject.subject_code,
                'subject_name': e.section.subject.name,
                'section': e.section.section_name,
                'units': e.section.subject.units,
                'schedule': e.section.schedule,
                'instructor': e.section.instructor,
                'enrolled_at': e.enrolled_at,
            }
            for e in enrollments
        ]

    def get_total_subjects(self, obj):
        return obj.enrollments.filter(status='enrolled').count()
