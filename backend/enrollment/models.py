from django.db import models


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def total_enrolled_units(self):
        return sum(
            enrollment.section.subject.units
            for enrollment in self.enrollments.filter(status='enrolled')
        )


class Subject(models.Model):
    subject_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    units = models.PositiveIntegerField(default=3)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject_code} - {self.name}"


class Section(models.Model):
    section_name = models.CharField(max_length=50)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sections')
    max_students = models.PositiveIntegerField(default=30)
    schedule = models.CharField(max_length=200, blank=True)
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
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'section')

    def __str__(self):
        return f"{self.student.full_name} -> {self.section}"
