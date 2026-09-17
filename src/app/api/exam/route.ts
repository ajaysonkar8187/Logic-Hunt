import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentLoginSchema, submitExamSchema, violationSchema } from "@/lib/validators";
import { scoreAnswer } from "@/lib/scoring";

// POST /api/exam — handles login, save-answer, submit, violation via `action` field
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    // ── Student Login (join event) ────────────────────────────────────────
    if (action === "login") {
      const parsed = studentLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
      }

      const { name, email, eventId } = parsed.data;

      // Check event exists and is active
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      if (event.status !== "ACTIVE") {
        return NextResponse.json({ success: false, error: "This competition is not active yet" }, { status: 400 });
      }

      // Check duplicate
      const existing = await prisma.participant.findUnique({
        where: { email_eventId: { email: email.toLowerCase(), eventId } },
      });
      if (existing) {
        return NextResponse.json({ success: false, error: "This email has already been used for this event" }, { status: 409 });
      }

      const participant = await prisma.participant.create({
        data: {
          name,
          email: email.toLowerCase(),
          eventId,
          status: "REGISTERED",
        },
      });

      return NextResponse.json({ success: true, data: participant }, { status: 201 });
    }

    // ── Start Exam ────────────────────────────────────────────────────────
    if (action === "start") {
      const { participantId } = body;
      if (!participantId) return NextResponse.json({ success: false, error: "Participant ID required" }, { status: 400 });

      const participant = await prisma.participant.update({
        where: { id: participantId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: participant });
    }

    // ── Auto-save single answer ───────────────────────────────────────────
    if (action === "save-answer") {
      const { participantId, questionId, answer, timeTaken } = body;
      if (!participantId || !questionId) {
        return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
      }

      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });

      const score = scoreAnswer(question, answer);
      const isCorrect = score === question.marks;

      await prisma.questionResponse.upsert({
        where: { participantId_questionId: { participantId, questionId } },
        update: { answer, score, isCorrect, timeTaken },
        create: { participantId, questionId, answer, score, isCorrect, timeTaken },
      });

      return NextResponse.json({ success: true });
    }

    // ── Submit Exam ───────────────────────────────────────────────────────
    if (action === "submit") {
      const parsed = submitExamSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
      }

      const { participantId, answers, timeTaken } = parsed.data;

      // Get participant and their event's questions
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { event: { include: { eventQuestions: { include: { question: true } } } } },
      });
      if (!participant) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });
      if (participant.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "Exam already submitted" }, { status: 409 });
      }

      // Score each question
      let totalScore = 0;
      const questions = participant.event.eventQuestions.map((eq) => eq.question);

      for (const q of questions) {
        const answer = answers[q.id];
        const score = scoreAnswer(q, answer);
        const isCorrect = score === q.marks;
        totalScore += score;

        await prisma.questionResponse.upsert({
          where: { participantId_questionId: { participantId, questionId: q.id } },
          update: { answer: answer ?? null, score, isCorrect },
          create: { participantId, questionId: q.id, answer: answer ?? null, score, isCorrect },
        });
      }

      // Update participant
      await prisma.participant.update({
        where: { id: participantId },
        data: { status: "COMPLETED", score: totalScore, timeTaken, completedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: { score: totalScore } });
    }

    // ── Log Violation ─────────────────────────────────────────────────────
    if (action === "violation") {
      const parsed = violationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
      }

      await prisma.violation.create({ data: parsed.data as any });
      return NextResponse.json({ success: true });
    }

    // ── Response Sheet (only once the admin has ended the event) ───────────
    if (action === "results") {
      const { participantId, email, eventId } = body;

      const participant = participantId
        ? await prisma.participant.findUnique({ where: { id: participantId } })
        : email && eventId
        ? await prisma.participant.findUnique({ where: { email_eventId: { email: String(email).toLowerCase(), eventId } } })
        : null;

      if (!participant) {
        return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });
      }

      const event = await prisma.event.findUnique({ where: { id: participant.eventId } });
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });

      if (event.status !== "COMPLETED") {
        return NextResponse.json({ success: false, error: "Results are not available until the organizer ends the event" }, { status: 403 });
      }
      if (participant.status !== "COMPLETED") {
        return NextResponse.json({ success: false, error: "You have not submitted this exam" }, { status: 403 });
      }

      const eventQuestions = await prisma.eventQuestion.findMany({
        where: { eventId: participant.eventId },
        include: { question: true },
        orderBy: { sortOrder: "asc" },
      });
      const responses = await prisma.questionResponse.findMany({ where: { participantId: participant.id } });
      const responseMap = new Map(responses.map((r) => [r.questionId, r]));

      const sheet = eventQuestions.map((eq) => {
        const q = eq.question;
        const r = responseMap.get(q.id);
        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          marks: q.marks,
          studentAnswer: r?.answer ?? null,
          isCorrect: r?.isCorrect ?? false,
          score: r?.score ?? 0,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          participant: { name: participant.name, email: participant.email, score: participant.score, timeTaken: participant.timeTaken },
          totalMarks: sheet.reduce((a, q) => a + q.marks, 0),
          sheet,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/exam error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
