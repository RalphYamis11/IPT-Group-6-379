from rest_framework import serializers
from .models import Student, Subject, Section, Enrollment


class StudentSerializer(serializers.ModelSerializer):
    total_enrolled_units = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    year_level_display = serializers.ReadOnlyField()

    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'first_name', 'middle_name', 'last_name', 'full_name',
            'email', 'contact_number', 'gender', 'year_level', 'year_level_display',
            'course', 'total_enrolled_units', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_student_id(self, value):
        if not value.strip():
            raise serializers.ValidationError("Student ID cannot be blank.")
        return value.strip().upper()

    def validate_email(self, value):
        return value.strip().lower()

    def validate_year_level(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Year level must be between 1 and 4.")
        return value

    def validate_contact_number(self, value):
        if value and not value.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("Contact number must contain only digits, +, -, or spaces.")
        return value


class SubjectPrerequisiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'subject_code', 'name']


class SubjectSerializer(serializers.ModelSerializer):
    total_sections = serializers.SerializerMethodField()
    prerequisite_details = SubjectPrerequisiteSerializer(source='prerequisite', read_only=True)

    class Meta:
        model = Subject
        fields = [
            'id', 'subject_code', 'name', 'units', 'subject_type',
            'description', 'prerequisite', 'prerequisite_details',
            'total_sections', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_sections(self, obj):
        return obj.sections.count()

    def validate_units(self, value):
        if value < 1 or value > 6:
            raise serializers.ValidationError("Units must be between 1 and 6.")
        return value

    def validate_subject_code(self, value):
        return value.strip().upper()

    def validate(self, data):
        if self.instance and data.get('prerequisite') == self.instance:
            raise serializers.ValidationError("A subject cannot be its own prerequisite.")
        return data


class SectionSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    enrolled_count = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()

    class Meta:
        model = Section
        fields = [
            'id', 'section_name', 'subject', 'subject_details',
            'max_students', 'schedule', 'room', 'instructor',
            'enrolled_count', 'available_slots', 'is_full', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_max_students(self, value):
        if value < 1:
            raise serializers.ValidationError("Max students must be at least 1.")
        if value > 200:
            raise serializers.ValidationError("Max students cannot exceed 200.")
        return value


class EnrollmentSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    section_details = SectionSerializer(source='section', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'section', 'student_details',
            'section_details', 'status', 'remarks', 'enrolled_at', 'updated_at'
        ]
        read_only_fields = ['id', 'enrolled_at', 'updated_at']

    def validate(self, data):
        student = data.get('student')
        section = data.get('section')

        if self.instance is None:
            if Enrollment.objects.filter(student=student, section=section, status='enrolled').exists():
                raise serializers.ValidationError("Student is already enrolled in this section.")

            if Enrollment.objects.filter(
                student=student, section__subject=section.subject, status='enrolled'
            ).exists():
                raise serializers.ValidationError(
                    f"Student is already enrolled in another section of {section.subject.subject_code}."
                )

            if section.is_full:
                raise serializers.ValidationError(
                    f"Section {section.section_name} is already full "
                    f"({section.max_students}/{section.max_students} students)."
                )

        return data


class EnrollmentSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    year_level_display = serializers.ReadOnlyField()
    total_enrolled_units = serializers.ReadOnlyField()
    enrolled_subjects = serializers.SerializerMethodField()
    total_subjects = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'full_name', 'email', 'course',
            'year_level', 'year_level_display',
            'total_enrolled_units', 'total_subjects', 'enrolled_subjects'
        ]

    def get_enrolled_subjects(self, obj):
        enrollments = obj.enrollments.filter(status='enrolled').select_related('section__subject')
        return [
            {
                'enrollment_id': e.id,
                'subject_code': e.section.subject.subject_code,
                'subject_name': e.section.subject.name,
                'subject_type': e.section.subject.subject_type,
                'section': e.section.section_name,
                'units': e.section.subject.units,
                'schedule': e.section.schedule,
                'room': e.section.room,
                'instructor': e.section.instructor,
                'enrolled_at': e.enrolled_at,
            }
            for e in enrollments
        ]

    def get_total_subjects(self, obj):
        return obj.enrollments.filter(status='enrolled').count()
