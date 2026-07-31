import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validators";

// GET /api/questions
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");

    if (eventId) {
      const eventQuestions = await prisma.eventQuestion.findMany({
        where: { eventId },
        include: { question: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ success: true, data: eventQuestions.map((eq) => eq.question) });
    }

    const questions = await prisma.question.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// POST /api/questions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support bulk create
    if (Array.isArray(body)) {
      const questions = [];
      for (const item of body) {
        const parsed = questionSchema.safeParse(item);
        if (!parsed.success) continue;
        const q = await prisma.question.create({ data: parsed.data as any });
        questions.push(q);
      }
      return NextResponse.json({ success: true, data: questions }, { status: 201 });
    }

    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const question = await prisma.question.create({ data: parsed.data as any });

    // Optionally link to event
    if (body.eventId) {
      const count = await prisma.eventQuestion.count({ where: { eventId: body.eventId } });
      await prisma.eventQuestion.create({
        data: { eventId: body.eventId, questionId: question.id, sortOrder: count },
      });
    }

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// PUT /api/questions
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });

    const parsed = questionSchema.partial().safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const question = await prisma.question.update({ where: { id }, data: parsed.data as any });
    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error("PUT /api/questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/questions
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/questions error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
