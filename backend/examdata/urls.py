from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, TopicViewSet, QuestionViewSet, ExamVersionViewSet

router = DefaultRouter()
router.register("courses", CourseViewSet)
router.register("topics", TopicViewSet)
router.register("questions", QuestionViewSet)
router.register("exam-versions", ExamVersionViewSet)

urlpatterns = router.urls
