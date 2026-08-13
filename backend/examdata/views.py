from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Course, Topic, Question, ExamVersion
from .serializers import (
    CourseSerializer, TopicSerializer, QuestionSerializer, ExamVersionSerializer,
)
from .generator import generate_exam_versions


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("code")
    serializer_class = CourseSerializer


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all().order_by("name")
    serializer_class = TopicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by("-created_at")
    serializer_class = QuestionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("course"):
            qs = qs.filter(course_id=params["course"])
        if params.get("topic"):
            qs = qs.filter(topic_id=params["topic"])
        if params.get("difficulty"):
            qs = qs.filter(difficulty=params["difficulty"])
        if params.get("qtype"):
            qs = qs.filter(qtype=params["qtype"])
        return qs


class ExamVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExamVersion.objects.all().order_by("-created_at")
    serializer_class = ExamVersionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    @action(detail=False, methods=["post"])
    def generate(self, request):
        course_id = request.data.get("course")
        course = get_object_or_404(Course, id=course_id)
        num_versions = int(request.data.get("num_versions", 3))
        questions_per_exam = int(request.data.get("questions_per_exam", 20))
        mcq_ratio = float(request.data.get("mcq_ratio", 0.7))
        labels = request.data.get("labels")

        try:
            versions_data = generate_exam_versions(
                course, num_versions, questions_per_exam, mcq_ratio, labels
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for v in versions_data:
            exam = ExamVersion.objects.create(
                course=course,
                label=v["label"],
                title=f"{course.code} Exam {v['label']}",
                question_ids_ordered=v["question_ids_ordered"],
                snapshot_json=v["snapshot"],
            )
            created.append(exam)

        serializer = ExamVersionSerializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
