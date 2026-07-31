import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats?eventId=xxx
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");

    const [totalParticipants, totalQuestions, events] = await Promise.all([
      prisma.participant.count(eventId ? { where: { eventId } } : undefined),
      prisma.question.count(),
      prisma.event.count(),
    ]);

    const completed = await prisma.participant.findMany({
      where: { ...(eventId ? { eventId } : {}), status: "COMPLETED" },
      select: { score: true },
    });

    const avgScore = completed.length
      ? Math.round((completed.reduce((a, p) => a + p.score, 0) / completed.length) * 10) / 10
      : 0;
    const highestScore = completed.length ? Math.max(...completed.map((p) => p.score)) : 0;
    const completionRate = totalParticipants > 0
      ? Math.round((completed.length / totalParticipants) * 100)
      : 0;

    // Difficulty breakdown
    const difficulties = await prisma.question.groupBy({
      by: ["difficulty"],
      _count: { _all: true },
    });

    // Score distribution
    const scores = completed.map((p) => p.score);
    const distribution: Record<string, number> = {};
    scores.forEach((s) => {
      const bucket = Math.floor(s / 5) * 5;
      const key = `${bucket}-${bucket + 4}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalParticipants,
        totalQuestions,
        totalEvents: events,
        avgScore,
        highestScore,
        completionRate,
        difficulties: difficulties.map((d) => ({ difficulty: d.difficulty, count: d._count._all })),
        scoreDistribution: distribution,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
