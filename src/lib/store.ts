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
  globalTimeLeft: number;
  questionTimeLeft: number;
  startedAt: number | null;
  submitted: boolean;
  lockedQuestions: string[];
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
  lockQuestion: (questionId: string) => void;
  resetExam: () => void;
}

const defaultExam: ExamState = {
  currentIndex: 0,
  answers: {},
  violations: [],
  globalTimeLeft: 0,
  questionTimeLeft: 0,
  startedAt: null,
  submitted: false,
  lockedQuestions: [],
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
  lockQuestion: (questionId) =>
    set((state) => ({
      exam: {
        ...state.exam,
        lockedQuestions: state.exam.lockedQuestions.includes(questionId)
          ? state.exam.lockedQuestions
          : [...state.exam.lockedQuestions, questionId],
      },
    })),
  resetExam: () => set({ exam: { ...defaultExam } }),
}));
