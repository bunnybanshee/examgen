import axios from "axios";
import type { Course, Topic, Question, ExamVersion } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const client = axios.create({ baseURL: API_BASE });

async function listAll<T>(url: string): Promise<T[]> {
  const res = await client.get(url);
  return res.data.results ?? res.data;
}

export const api = {
  courses: {
    list: () => listAll<Course>("/courses/"),
    create: (data: Partial<Course>) => client.post<Course>("/courses/", data).then((r) => r.data),
  },
  topics: {
    list: (courseId?: string) =>
      listAll<Topic>(`/topics/${courseId ? `?course=${courseId}` : ""}`),
    create: (data: Partial<Topic>) => client.post<Topic>("/topics/", data).then((r) => r.data),
  },
  questions: {
    list: (filters: Record<string, string | undefined> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      const qs = params.toString();
      return listAll<Question>(`/questions/${qs ? `?${qs}` : ""}`);
    },
    create: (data: Partial<Question>) => client.post<Question>("/questions/", data).then((r) => r.data),
    update: (id: string, data: Partial<Question>) =>
      client.patch<Question>(`/questions/${id}/`, data).then((r) => r.data),
    delete: (id: string) => client.delete(`/questions/${id}/`),
  },
  examVersions: {
    list: (courseId?: string) =>
      listAll<ExamVersion>(`/exam-versions/${courseId ? `?course=${courseId}` : ""}`),
    generate: (payload: {
      course: string;
      num_versions: number;
      questions_per_exam: number;
      mcq_ratio: number;
    }) => client.post<ExamVersion[]>("/exam-versions/generate/", payload).then((r) => r.data),
  },
};

export default api;
