import { z } from "zod";

// ─── Student Login ──────────────────────────────────────────────────────────
export const studentLoginSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name should contain only letters and spaces"),
  email: z
    .string()
    .email("Enter a valid email address")
    .refine((val) => val.toLowerCase().endsWith("@sitare.org"), "Only @sitare.org email addresses are allowed"),
  eventId: z.string().min(1),
});

// ─── Admin Login ────────────────────────────────────────────────────────────
export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// ─── Event ──────────────────────────────────────────────────────────────────
export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200),
  description: z.string().max(1000).optional(),
  timeLimitMin: z.number().int().min(1).max(180).default(15),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
});

// ─── Question ───────────────────────────────────────────────────────────────
export const questionSchema = z.object({
  title: z.string().min(1, "Question text is required").max(2000),
  type: z.enum([
    "MCQ", "MULTI_SELECT", "IMAGE_PUZZLE", "SUDOKU", "PATTERN",
    "LOGICAL", "RIDDLE", "CIPHER", "SPOT_DIFF", "MATCH_PAIRS", "ORDERING",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  category: z.string().min(1),
  options: z.any().optional(),
  correctAnswer: z.any(),
  explanation: z.string().max(2000).optional(),
  marks: z.number().int().min(1).default(1),
  timeLimitSec: z.number().int().min(5).max(600).default(30),
  hint: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.any().optional(),
});

// ─── Exam Submission ────────────────────────────────────────────────────────
export const submitAnswerSchema = z.object({
  participantId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.any(),
  timeTaken: z.number().int().optional(),
});

export const submitExamSchema = z.object({
  participantId: z.string().min(1),
  answers: z.record(z.string(), z.any()),
  timeTaken: z.number().int(),
});

// ─── Violation ──────────────────────────────────────────────────────────────
export const violationSchema = z.object({
  participantId: z.string().min(1),
  type: z.enum([
    "TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT",
    "COPY_ATTEMPT", "DEVTOOLS_ATTEMPT", "RECONNECT",
  ]),
  details: z.string().max(500).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
export type ViolationInput = z.infer<typeof violationSchema>;
