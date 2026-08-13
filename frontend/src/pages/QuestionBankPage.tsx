import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import api from "../api/client";
import type { Course, Topic, Question, QType, Difficulty } from "../types";

const emptyForm = {
  topic: "",
  qtype: "MCQ" as QType,
  difficulty: "MEDIUM" as Difficulty,
  prompt: "",
  choices: ["", "", "", ""],
  correct_index: 0,
  correct_answer: "",
};

export default function QuestionBankPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.courses.list().then((cs) => {
      setCourses(cs);
      if (cs.length && !courseId) setCourseId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    refreshTopics();
    refreshQuestions();
  }, [courseId]);

  function refreshTopics() {
    api.topics.list(courseId).then(setTopics);
  }

  function refreshQuestions() {
    setLoading(true);
    api.questions
      .list({ course: courseId })
      .then(setQuestions)
      .finally(() => setLoading(false));
  }

  async function handleCreateCourse() {
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;
    const c = await api.courses.create({ code: newCourseCode, title: newCourseTitle });
    setCourses((prev) => [...prev, c]);
    setCourseId(c.id);
    setNewCourseCode("");
    setNewCourseTitle("");
  }

  async function handleCreateTopic() {
    if (!newTopicName.trim() || !courseId) return;
    const t = await api.topics.create({ course: courseId, name: newTopicName });
    setTopics((prev) => [...prev, t]);
    setNewTopicName("");
  }

  function openNewQuestionForm() {
    setEditingId(null);
    setForm({ ...emptyForm, topic: topics[0]?.id ?? "" });
    setError(null);
    setShowForm(true);
  }

  function openEditForm(q: Question) {
    setEditingId(q.id);
    setForm({
      topic: q.topic,
      qtype: q.qtype,
      difficulty: q.difficulty,
      prompt: q.prompt,
      choices: q.qtype === "MCQ" ? [...q.choices_json] : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
      correct_answer: q.correct_answer,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setError(null);
    if (!form.topic || !form.prompt.trim()) {
      setError("Topic and question text are required.");
      return;
    }
    const payload: Partial<Question> = {
      course: courseId,
      topic: form.topic,
      qtype: form.qtype,
      difficulty: form.difficulty,
      prompt: form.prompt,
      choices_json: form.qtype === "MCQ" ? form.choices.filter((c) => c.trim() !== "") : [],
      correct_index: form.qtype === "MCQ" ? form.correct_index : undefined,
      correct_answer: form.qtype === "FIB" ? form.correct_answer : "",
    };
    try {
      if (editingId) {
        await api.questions.update(editingId, payload);
      } else {
        await api.questions.create(payload);
      }
      setShowForm(false);
      refreshQuestions();
    } catch (e: any) {
      setError(e?.response?.data?.non_field_errors?.[0] || "Couldn't save question. Check the fields.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    await api.questions.delete(id);
    refreshQuestions();
  }

  const difficultyColor: Record<Difficulty, string> = {
    EASY: "bg-green-100 text-green-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HARD: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        {courseId && (
          <button
            onClick={openNewQuestionForm}
            className="flex items-center gap-2 bg-[#2E5339] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Add Question
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">New course code</label>
            <input
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
              placeholder="COS 202"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              placeholder="OOP with Java"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
            />
          </div>
          <button
            onClick={handleCreateCourse}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            Add course
          </button>
        </div>

        {courseId && (
          <div className="flex items-end gap-2 ml-auto">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">New topic</label>
              <input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g. Pointers"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <button
              onClick={handleCreateTopic}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              Add topic
            </button>
          </div>
        )}
      </div>

      {!courseId ? (
        <p className="text-gray-500">Create a course above to get started.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500">No questions yet for this course. Add your first one.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-md truncate">{q.prompt}</td>
                  <td className="px-4 py-3 text-gray-500">{q.topic_name}</td>
                  <td className="px-4 py-3 text-gray-500">{q.qtype === "MCQ" ? "MCQ" : "Fill-in-blank"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${difficultyColor[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEditForm(q)} className="text-gray-400 hover:text-gray-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editingId ? "Edit Question" : "Add Question"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                >
                  <option value="">Select topic…</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select
                    value={form.qtype}
                    onChange={(e) => setForm({ ...form, qtype: e.target.value as QType })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="FIB">Fill in the Blank</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Question text</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                  rows={2}
                />
              </div>

              {form.qtype === "MCQ" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Choices (mark the correct one)</label>
                  <div className="space-y-2">
                    {form.choices.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={form.correct_index === i}
                          onChange={() => setForm({ ...form, correct_index: i })}
                        />
                        <input
                          value={c}
                          onChange={(e) => {
                            const choices = [...form.choices];
                            choices[i] = e.target.value;
                            setForm({ ...form, choices });
                          }}
                          placeholder={`Choice ${i + 1}`}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Correct answer</label>
                  <input
                    value={form.correct_answer}
                    onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-sm bg-[#2E5339] text-white hover:opacity-90"
              >
                {editingId ? "Save changes" : "Add question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
