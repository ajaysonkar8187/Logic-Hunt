import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/event-questions - attach an existing question to an event
export async function POST(req: NextRequest) {
  try {
    const { eventId, questionId } = await req.json();
    if (!eventId || !questionId) {
      return NextResponse.json({ success: false, error: "eventId and questionId are required" }, { status: 400 });
    }

    const existing = await prisma.eventQuestion.findUnique({
      where: { eventId_questionId: { eventId, questionId } },
    });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const count = await prisma.eventQuestion.count({ where: { eventId } });
    const eventQuestion = await prisma.eventQuestion.create({
      data: { eventId, questionId, sortOrder: count },
    });
    return NextResponse.json({ success: true, data: eventQuestion }, { status: 201 });
  } catch (error) {
    console.error("POST /api/event-questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/event-questions?eventId=&questionId= - detach a question from an event
export async function DELETE(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");
    const questionId = req.nextUrl.searchParams.get("questionId");
    if (!eventId || !questionId) {
      return NextResponse.json({ success: false, error: "eventId and questionId are required" }, { status: 400 });
    }

    await prisma.eventQuestion.delete({
      where: { eventId_questionId: { eventId, questionId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/event-questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
