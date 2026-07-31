import type { Question } from "@prisma/client";

/**
 * Score a single answer for a given question.
 * Returns the score (0 to question.marks).
 */
export function scoreAnswer(question: Question, answer: unknown): number {
  if (answer === null || answer === undefined) return 0;
  if (Array.isArray(answer) && answer.length === 0) return 0;
  if (typeof answer === "string" && answer.trim() === "") return 0;

  const { type, correctAnswer, marks } = question;
  const correct = correctAnswer as unknown;

  switch (type) {
    case "MCQ":
    case "RIDDLE":
    case "PATTERN":
    case "LOGICAL":
    case "IMAGE_PUZZLE": {
      const norm = (s: unknown) => String(s).trim().toLowerCase();
      return norm(answer) === norm(correct) ? marks : 0;
    }

    case "CIPHER": {
      const norm = (s: unknown) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
      return norm(answer) === norm(correct) ? marks : 0;
    }

    case "MULTI_SELECT": {
      if (!Array.isArray(answer) || !Array.isArray(correct)) return 0;
      const correctSet = new Set(correct.map((s: string) => s.toLowerCase()));
      const chosenSet = new Set((answer as string[]).map((s) => s.toLowerCase()));
      let hits = 0;
      chosenSet.forEach((c) => {
        if (correctSet.has(c)) hits++;
      });
      const wrong = chosenSet.size - hits;
      // Partial scoring: correct hits minus wrong selections, minimum 0
      const score = Math.max(0, (hits / correctSet.size - wrong / correctSet.size)) * marks;
      return Math.round(score * 100) / 100;
    }

    case "ORDERING": {
      if (!Array.isArray(answer) || !Array.isArray(correct)) return 0;
      const isCorrect = answer.length === correct.length &&
        answer.every((item: string, i: number) => item === correct[i]);
      return isCorrect ? marks : 0;
    }

    case "MATCH_PAIRS": {
      // answer and correct are both Record<string, string>
      if (typeof answer !== "object" || typeof correct !== "object") return 0;
      const a = answer as Record<string, string>;
      const c = correct as Record<string, string>;
      const keys = Object.keys(c);
      if (keys.length === 0) return 0;
      let hits = 0;
      keys.forEach((k) => {
        if (a[k]?.toLowerCase() === c[k]?.toLowerCase()) hits++;
      });
      return Math.round((hits / keys.length) * marks * 100) / 100;
    }

    default:
      return 0;
  }
}

/**
 * Score an entire exam submission.
 * Returns { totalScore, results: { questionId, score, isCorrect }[] }
 */
export function scoreExam(
  questions: Question[],
  answers: Record<string, unknown>
): {
  totalScore: number;
  results: { questionId: string; score: number; isCorrect: boolean }[];
} {
  let totalScore = 0;
  const results = questions.map((q) => {
    const score = scoreAnswer(q, answers[q.id]);
    const isCorrect = score === q.marks;
    totalScore += score;
    return { questionId: q.id, score, isCorrect };
  });
  return { totalScore, results };
}
