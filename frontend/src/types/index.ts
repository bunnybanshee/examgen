export type QType = "MCQ" | "FIB";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Course {
  id: string;
  code: string;
  title: string;
}

export interface Topic {
  id: string;
  course: string;
  name: string;
}

export interface Question {
  id: string;
  course: string;
  topic: string;
  topic_name: string;
  qtype: QType;
  difficulty: Difficulty;
  prompt: string;
  choices_json: string[];
  correct_index: number | null;
  correct_answer: string;
  created_at: string;
}

export interface SnapshotQuestion {
  question_id: string;
  qtype: QType;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  choices?: string[];
  correct_index?: number;
  correct_letter?: string;
  correct_answer?: string;
}

export interface ExamVersion {
  id: string;
  course: string;
  label: string;
  title: string;
  created_at: string;
  question_ids_ordered: string[];
  snapshot_json: SnapshotQuestion[];
}
