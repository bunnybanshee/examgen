from django.contrib import admin
from .models import Course, Topic, Question, ExamVersion

admin.site.register(Course)
admin.site.register(Topic)
admin.site.register(Question)
admin.site.register(ExamVersion)
