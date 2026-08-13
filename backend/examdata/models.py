import uuid
from django.db import models


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.code} - {self.title}"


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, related_name="topics", on_delete=models.CASCADE)
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Question(models.Model):
    class QType(models.TextChoices):
        MCQ = "MCQ", "Multiple Choice"
        FILL_BLANK = "FIB", "Fill in the Blank"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, related_name="questions", on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, related_name="questions", on_delete=models.CASCADE)
    qtype = models.CharField(max_length=3, choices=QType.choices, default=QType.MCQ)
    difficulty = models.CharField(max_length=6, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    prompt = models.TextField()
    choices_json = models.JSONField(default=list, blank=True)
    correct_index = models.PositiveSmallIntegerField(null=True, blank=True)
    correct_answer = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.prompt[:60]


class ExamVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, related_name="exam_versions", on_delete=models.CASCADE)
    label = models.CharField(max_length=10)
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    question_ids_ordered = models.JSONField(default=list)
    snapshot_json = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.course.code} Exam {self.label}"
