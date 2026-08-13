from rest_framework import serializers
from .models import Course, Topic, Question, ExamVersion


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "code", "title"]


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "course", "name"]


class QuestionSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source="topic.name", read_only=True)

    class Meta:
        model = Question
        fields = [
            "id", "course", "topic", "topic_name", "qtype", "difficulty",
            "prompt", "choices_json", "correct_index", "correct_answer", "created_at",
        ]

    def validate(self, data):
        qtype = data.get("qtype", getattr(self.instance, "qtype", None))
        if qtype == Question.QType.MCQ:
            choices = data.get("choices_json", getattr(self.instance, "choices_json", None))
            correct_index = data.get("correct_index", getattr(self.instance, "correct_index", None))
            if not choices or len(choices) < 2:
                raise serializers.ValidationError("MCQ questions need at least 2 choices.")
            if correct_index is None or correct_index >= len(choices):
                raise serializers.ValidationError("correct_index must point at a valid choice.")
        elif qtype == Question.QType.FILL_BLANK:
            correct_answer = data.get("correct_answer", getattr(self.instance, "correct_answer", None))
            if not correct_answer:
                raise serializers.ValidationError("Fill-in-the-blank questions need correct_answer.")
        return data


class ExamVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamVersion
        fields = ["id", "course", "label", "title", "created_at", "question_ids_ordered", "snapshot_json"]
