import { useEffect, useState } from "react";
import { Sparkles, Download } from "lucide-react";
import api from "../api/client";
import type { Course, ExamVersion } from "../types";

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function examToText(exam: ExamVersion, courseLabel: string): string {
  const lines: string[] = [];
  lines.push(`${courseLabel} — Exam ${exam.label}`);
  lines.push("");
  exam.snapshot_json.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.prompt}`);
    if (q.qtype === "MCQ" && q.choices) {
      q.choices.forEach((choice, ci) => {
        lines.push(`   ${String.fromCharCode(65 + ci)}. ${choice}`);
      });
    } else {
      lines.push("   ______________________");
    }
    lines.push("");
  });
  return lines.join("\n");
}

function answerKeyToText(exam: ExamVersion, courseLabel: string): string {
  const lines: string[] = [];
  lines.push(`${courseLabel} — Exam ${exam.label} — Answer Key`);
  lines.push("");
  exam.snapshot_json.forEach((q, i) => {
    const answer = q.qtype === "MCQ" ? q.correct_letter : q.correct_answer;
    lines.push(`${i + 1}. ${answer}`);
  });
  return lines.join("\n");
}

export default function GenerateExamPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [numVersions, setNumVersions] = useState(3);
  const [questionsPerExam, setQuestionsPerExam] = useState(20);
  const [mcqRatio, setMcqRatio] = useState(0.7);
  const [exams, setExams] = useState<ExamVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.courses.list().then((cs) => {
      setCourses(cs);
      if (cs.length) setCourseId(cs[0].id);
    });
  }, []);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const result = await api.examVersions.generate({
        course: courseId,
        num_versions: numVersions,
        questions_per_exam: questionsPerExam,
        mcq_ratio: mcqRatio,
      });
      setExams(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Couldn't generate exams — check the question bank has enough questions.");
    } finally {
      setLoading(false);
    }
  }

  const courseLabel = courses.find((c) => c.id === courseId)?.code ?? "Exam";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Exam</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Number of exam types</label>
            <input
              type="number"
              min={1}
              max={5}
              value={numVersions}
              onChange={(e) => setNumVersions(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Questions per exam</label>
            <input
              type="number"
              min={5}
              max={100}
              value={questionsPerExam}
              onChange={(e) => setQuestionsPerExam(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">% Multiple choice</label>
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(mcqRatio * 100)}
              onChange={(e) => setMcqRatio(Number(e.target.value) / 100)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!courseId || loading}
          className="mt-4 flex items-center gap-2 bg-[#2E5339] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {loading ? "Generating…" : "Generate Exams"}
        </button>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {exams.length > 0 && (
        <div className="space-y-4">
          {exams.map((exam) => {
            const mcqCount = exam.snapshot_json.filter((q) => q.qtype === "MCQ").length;
            const fibCount = exam.snapshot_json.length - mcqCount;
            return (
              <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Exam {exam.label}</h3>
                    <p className="text-sm text-gray-500">
                      {exam.snapshot_json.length} questions · {mcqCount} MCQ · {fibCount} fill-in-the-blank
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        downloadText(`${courseLabel}_Exam_${exam.label}.txt`, examToText(exam, courseLabel))
                      }
                      className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <Download size={14} /> Exam
                    </button>
                    <button
                      onClick={() =>
                        downloadText(
                          `${courseLabel}_Exam_${exam.label}_AnswerKey.txt`,
                          answerKeyToText(exam, courseLabel)
                        )
                      }
                      className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <Download size={14} /> Answer Key
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
