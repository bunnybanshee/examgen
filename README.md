# ExamGen - Exam Question Bank Manager

A full-stack tool for lecturers to manage a question bank and auto-generate
balanced, non-overlapping exam variants (A, B, C…) with answer keys —
built to replace manually assembling exam sets in Word.

**Stack:** React + TypeScript + Tailwind CSS (frontend) · Django + Django REST Framework (backend) · SQLite (dev)

## Why this exists

Setting multiple exam variants by hand - pulling questions, balancing
difficulty and topic coverage, keeping the correct-answer letters from
clustering on "B" - is slow and error-prone. This tool automates it:

- Store questions once, tagged by course, topic, difficulty, and type (MCQ or fill-in-the-blank)
- Generate N exam variants at once, each with no overlapping questions
- MCQ choices are independently reshuffled per exam variant, so the correct-answer
  letter distribution stays balanced across the exam (not clustered on one letter)
- Export each variant and its answer key as plain `.txt` files, ready to paste into a Word doc or LMS

## Project structure

```
examgen/
├── backend/          Django REST API
│   ├── config/        project settings/urls
│   └── examdata/      models, serializers, views, exam-generation logic
└── frontend/          React + TypeScript + Vite app
    └── src/
        ├── api/        typed API client (axios)
        ├── pages/       Question Bank + Generate Exam screens
        └── types/       shared TypeScript types
```

## Running locally

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo      # optional: loads a 60-question demo bank for COS 201
python manage.py runserver 8000
```

API will be live at `http://127.0.0.1:8000/api/`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # points the app at the API above
npm run dev
```

App will be live at `http://127.0.0.1:5173`.

## Core exam-generation logic

The interesting part lives in `backend/examdata/generator.py`:

1. Splits the course's question bank into MCQ and fill-in-the-blank pools
2. Draws non-overlapping sets for each requested exam variant, respecting the target MCQ/FIB ratio
3. For every MCQ question, independently shuffles its choice order per variant and
   recomputes the correct index — so across a 20-question exam, correct answers
   land roughly evenly across A/B/C/D instead of clustering
4. Snapshots the fully-rendered exam (shuffled choices included) into the database,
   so a later edit to the source question bank doesn't retroactively change an
   already-generated exam

## API overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/courses/` | GET, POST | List/create courses |
| `/api/topics/?course=<id>` | GET, POST | List/create topics for a course |
| `/api/questions/?course=<id>` | GET, POST, PATCH, DELETE | Manage the question bank |
| `/api/exam-versions/generate/` | POST | Generate N balanced exam variants |

## Notes

This was built as a portfolio/demo project modeling a real workflow (generating
multiple exam types with answer keys for a university course), not a production
deployment — there's no auth layer yet, and SQLite is fine for local use but
would want swapping for Postgres in production.
