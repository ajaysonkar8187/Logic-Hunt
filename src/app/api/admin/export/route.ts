import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/export?eventId=xxx
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

    let csv = "Rank,Full Name,Email,Score,Total Marks,Accuracy %,Time Taken (s),Violations,Status\n";
    participants.forEach((p, i) => {
      const accuracy = maxScore > 0 ? Math.round((p.score / maxScore) * 100) : 0;
      csv += `${i + 1},"${p.name}","${p.email}",${p.score},${maxScore},${accuracy},${p.timeTaken || 0},${p._count.violations},${p.status}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="participants-export.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
