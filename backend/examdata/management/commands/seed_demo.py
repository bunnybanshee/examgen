import random
from django.core.management.base import BaseCommand
from examdata.models import Course, Topic, Question


class Command(BaseCommand):
    help = "Seed a small demo question bank for COS 201 (C Programming)"

    def handle(self, *args, **options):
        course, _ = Course.objects.get_or_create(code="COS 201", defaults={"title": "C Programming"})
        topics_names = ["Pointers", "Arrays", "Loops", "Functions", "Structs"]
        topics = {}
        for t in topics_names:
            topic, _ = Topic.objects.get_or_create(course=course, name=t)
            topics[t] = topic

        Question.objects.filter(course=course).delete()

        mcq_templates = [
            ("What does the '&' operator return when applied to a variable?", ["Its value", "Its memory address", "Its data type", "Its size in bytes"], 1),
            ("Which loop guarantees at least one execution of its body?", ["for", "while", "do-while", "foreach"], 2),
            ("What is the correct way to declare a pointer to an int?", ["int ptr;", "int *ptr;", "ptr int;", "*int ptr;"], 1),
            ("What does sizeof(int) typically return on a 32-bit system?", ["2", "4", "8", "1"], 1),
            ("Which keyword is used to define a structure in C?", ["class", "struct", "typedef", "object"], 1),
        ]
        fib_templates = [
            ("The ____ operator is used to dereference a pointer.", "*"),
            ("An array's name decays into a ____ to its first element.", "pointer"),
            ("The ____ statement is used to exit a loop early.", "break"),
            ("A function that calls itself is called a ____ function.", "recursive"),
            ("The ____ keyword prevents a variable's value from being modified.", "const"),
        ]

        difficulties = ["EASY", "MEDIUM", "HARD"]
        created = 0
        for i in range(60):
            topic = topics[topics_names[i % len(topics_names)]]
            difficulty = difficulties[i % len(difficulties)]
            if i % 2 == 0:
                prompt, choices, correct_idx = random.choice(mcq_templates)
                Question.objects.create(
                    course=course, topic=topic, qtype="MCQ", difficulty=difficulty,
                    prompt=f"{prompt} (variant {i})", choices_json=choices, correct_index=correct_idx,
                )
            else:
                prompt, answer = random.choice(fib_templates)
                Question.objects.create(
                    course=course, topic=topic, qtype="FIB", difficulty=difficulty,
                    prompt=f"{prompt} (variant {i})", correct_answer=answer,
                )
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo questions for {course.code}"))
