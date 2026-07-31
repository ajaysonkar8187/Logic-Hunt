import type {
  Event,
  Question,
  Participant,
  Violation,
  QuestionResponse,
} from "@prisma/client";

// Extended types with relations
export type EventWithQuestions = Event & {
  eventQuestions: { question: Question; sortOrder: number }[];
  participants: Participant[];
};

export type ParticipantWithRelations = Participant & {
  responses: QuestionResponse[];
  violations: Violation[];
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  email: string;
  score: number;
  timeTaken: number | null;
  accuracy: number;
  violationCount: number;
  status: string;
};

export type DashboardStats = {
  totalParticipants: number;
  totalQuestions: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
  activeCount: number;
  completedCount: number;
};

export type ScoreDistribution = {
  range: string;
  count: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};
