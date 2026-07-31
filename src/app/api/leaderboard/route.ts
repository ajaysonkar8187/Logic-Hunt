import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard?eventId=xxx
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 });

    const participants = await prisma.participant.findMany({
      where: { eventId },
      include: { _count: { select: { violations: true } } },
      orderBy: [{ score: "desc" }, { completedAt: "asc" }],
    });

    const totalMarks = await prisma.eventQuestion.findMany({
      where: { eventId },
      include: { question: { select: { marks: true } } },
    });
    const maxScore = totalMarks.reduce((a, eq) => a + eq.question.marks, 0);

    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      name: p.name,
      email: p.email,
      score: p.score,
      maxScore,
      timeTaken: p.timeTaken,
      accuracy: maxScore > 0 ? Math.round((p.score / maxScore) * 100) : 0,
      violationCount: p._count.violations,
      status: p.status,
      completedAt: p.completedAt,
    }));

    const completed = participants.filter((p) => p.status === "COMPLETED");
    const active = participants.filter((p) => p.status === "IN_PROGRESS");

    const stats = {
      total: participants.length,
      active: active.length,
      completed: completed.length,
      avgScore: completed.length
        ? Math.round((completed.reduce((a, p) => a + p.score, 0) / completed.length) * 10) / 10
        : 0,
      highestScore: completed.length ? Math.max(...completed.map((p) => p.score)) : 0,
      maxScore,
    };

    return NextResponse.json({ success: true, data: { leaderboard, stats } });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
