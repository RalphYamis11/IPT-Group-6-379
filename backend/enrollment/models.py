from django.db import models


class Student(models.Model):
    YEAR_LEVEL_CHOICES = [
        (1, '1st Year'),
        (2, '2nd Year'),
        (3, '3rd Year'),
        (4, '4th Year'),
    ]

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, default='')
    year_level = models.PositiveIntegerField(choices=YEAR_LEVEL_CHOICES, default=1)
    course = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name[0]}. {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    @property
    def total_enrolled_units(self):
        return sum(
            enrollment.section.subject.units
            for enrollment in self.enrollments.filter(status='enrolled')
        )

    @property
    def year_level_display(self):
        return dict(self.YEAR_LEVEL_CHOICES).get(self.year_level, 'Unknown')


class Subject(models.Model):
    SUBJECT_TYPE_CHOICES = [
        ('lecture', 'Lecture'),
        ('lab', 'Laboratory'),
        ('pe', 'Physical Education'),
        ('nstp', 'NSTP'),
    ]

    subject_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    units = models.PositiveIntegerField(default=3)
    subject_type = models.CharField(
        max_length=20, choices=SUBJECT_TYPE_CHOICES, default='lecture'
    )
    description = models.TextField(blank=True)
    prerequisite = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='unlocks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject_code} - {self.name}"


class Section(models.Model):
    section_name = models.CharField(max_length=50)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sections')
    max_students = models.PositiveIntegerField(default=30)
    schedule = models.CharField(max_length=200, blank=True)
    room = models.CharField(max_length=100, blank=True, default='')
    instructor = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('section_name', 'subject')

    def __str__(self):
        return f"{self.section_name} - {self.subject.subject_code}"

    @property
    def enrolled_count(self):
        return self.enrollments.filter(status='enrolled').count()

    @property
    def available_slots(self):
        return self.max_students - self.enrolled_count

    @property
    def is_full(self):
        return self.enrolled_count >= self.max_students


class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('dropped', 'Dropped'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    remarks = models.TextField(blank=True, default='')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'section')

    def __str__(self):
        return f"{self.student.full_name} -> {self.section}"
