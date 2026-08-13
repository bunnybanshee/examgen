"""
Exam generation logic.

- Multiple exam variants (A, B, C...) drawn from the same question bank, with
  no question repeated across variants of the same generation run.
- Balanced mix of MCQ and fill-in-the-blank.
- Correct-answer-letter distribution is balanced within each MCQ exam by
  reshuffling each question's choices independently per exam version.
"""
import string
import random
from .models import Question


def _shuffle_choices(question):
    choices = list(question.choices_json)
    correct_choice = choices[question.correct_index]
    indices = list(range(len(choices)))
    random.shuffle(indices)
    shuffled = [choices[i] for i in indices]
    new_correct_index = shuffled.index(correct_choice)
    return shuffled, new_correct_index


def _snapshot_question(question):
    if question.qtype == Question.QType.MCQ:
        shuffled, new_correct_index = _shuffle_choices(question)
        return {
            "question_id": str(question.id),
            "qtype": question.qtype,
            "topic": question.topic.name,
            "difficulty": question.difficulty,
            "prompt": question.prompt,
            "choices": shuffled,
            "correct_index": new_correct_index,
            "correct_letter": string.ascii_uppercase[new_correct_index],
        }
    return {
        "question_id": str(question.id),
        "qtype": question.qtype,
        "topic": question.topic.name,
        "difficulty": question.difficulty,
        "prompt": question.prompt,
        "correct_answer": question.correct_answer,
    }


def generate_exam_versions(course, num_versions, questions_per_exam, mcq_ratio=0.7, labels=None):
    labels = labels or list(string.ascii_uppercase[:num_versions])
    total_needed = num_versions * questions_per_exam

    mcq_qs = list(Question.objects.filter(course=course, qtype=Question.QType.MCQ))
    fib_qs = list(Question.objects.filter(course=course, qtype=Question.QType.FILL_BLANK))
    random.shuffle(mcq_qs)
    random.shuffle(fib_qs)

    if len(mcq_qs) + len(fib_qs) < total_needed:
        raise ValueError(
            f"Question bank has {len(mcq_qs) + len(fib_qs)} questions; "
            f"need {total_needed} for {num_versions} exams of {questions_per_exam} each."
        )

    mcq_per_exam = round(questions_per_exam * mcq_ratio)
    fib_per_exam = questions_per_exam - mcq_per_exam

    if len(mcq_qs) < mcq_per_exam * num_versions:
        mcq_per_exam = len(mcq_qs) // num_versions
        fib_per_exam = questions_per_exam - mcq_per_exam

    versions = []
    mcq_cursor, fib_cursor = 0, 0
    for label in labels:
        exam_mcqs = mcq_qs[mcq_cursor: mcq_cursor + mcq_per_exam]
        exam_fibs = fib_qs[fib_cursor: fib_cursor + fib_per_exam]
        mcq_cursor += mcq_per_exam
        fib_cursor += fib_per_exam

        pool = exam_mcqs + exam_fibs
        random.shuffle(pool)

        snapshot = [_snapshot_question(q) for q in pool]
        versions.append({
            "label": label,
            "question_ids_ordered": [str(q.id) for q in pool],
            "snapshot": snapshot,
        })

    return versions
