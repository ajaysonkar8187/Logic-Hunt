import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema, updateEventSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

// GET /api/events - list all events or get one by slug
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          eventQuestions: { include: { question: true }, orderBy: { sortOrder: "asc" } },
          _count: { select: { participants: true } },
        },
      });
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: event });
    }

    if (slug) {
      const event = await prisma.event.findUnique({
        where: { slug },
        include: {
          eventQuestions: { include: { question: true }, orderBy: { sortOrder: "asc" } },
          _count: { select: { participants: true } },
        },
      });
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: event });
    }

    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participants: true, eventQuestions: true } } },
    });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// POST /api/events - create event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, description, timeLimitMin } = parsed.data;
    const slug = slugify(name) + "-" + Date.now().toString(36);

    const event = await prisma.event.create({
      data: { name, slug, description, timeLimitMin },
    });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// PUT /api/events - update event
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 });

    const parsed = updateEventSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const event = await prisma.event.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("PUT /api/events error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/events
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 });

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
