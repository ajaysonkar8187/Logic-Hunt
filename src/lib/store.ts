import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  eventId: string;
}

export interface Violation {
  type: string;
  timestamp: number;
  details?: string;
}

export interface ExamState {
  currentIndex: number;
  answers: Record<string, unknown>;
  violations: Violation[];
  questionTimeLeft: number;
  startedAt: number | null;
  submitted: boolean;
}

// ─── App Store ──────────────────────────────────────────────────────────────

interface AppStore {
  // Student
  studentInfo: StudentInfo | null;
  setStudentInfo: (info: StudentInfo | null) => void;

  // Exam
  exam: ExamState;
  setExamField: <K extends keyof ExamState>(key: K, value: ExamState[K]) => void;
  setAnswer: (questionId: string, answer: unknown) => void;
  addViolation: (violation: Violation) => void;
  resetExam: () => void;
}

const defaultExam: ExamState = {
  currentIndex: 0,
  answers: {},
  violations: [],
  questionTimeLeft: 0,
  startedAt: null,
  submitted: false,
};

export const useAppStore = create<AppStore>((set) => ({
  studentInfo: null,
  setStudentInfo: (info) => set({ studentInfo: info }),

  exam: { ...defaultExam },
  setExamField: (key, value) =>
    set((state) => ({ exam: { ...state.exam, [key]: value } })),
  setAnswer: (questionId, answer) =>
    set((state) => ({
      exam: {
        ...state.exam,
        answers: { ...state.exam.answers, [questionId]: answer },
      },
    })),
  addViolation: (violation) =>
    set((state) => ({
      exam: {
        ...state.exam,
        violations: [...state.exam.violations, violation],
      },
    })),
  resetExam: () => set({ exam: { ...defaultExam } }),
}));
