import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.timeSlot.findMany({ orderBy: { slotType: "asc" } });

  audit(req, {
    action: "TIMESLOTS_VIEW",
    entityType: "TimeSlot",
    actor: actorOf(session),
  });

  return NextResponse.json(slots);
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { slotType, orderCutoffTime, deliveryTime, isActive } = await req.json();

    if (!["BREAKFAST", "DINNER"].includes(slotType)) {
      return NextResponse.json({ error: "Invalid slot type" }, { status: 400 });
    }
    if (!TIME_RE.test(orderCutoffTime) || !TIME_RE.test(deliveryTime)) {
      return NextResponse.json({ error: "Times must be in HH:MM (24h) format" }, { status: 400 });
    }

    const slot = await prisma.timeSlot.update({
      where: { slotType },
      data: {
        orderCutoffTime,
        deliveryTime,
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    audit(req, {
      action: "TIMESLOT_UPDATE",
      entityType: "TimeSlot",
      entityId: slot.id,
      actor: actorOf(session),
      metadata: { slotType, orderCutoffTime, deliveryTime, isActive: slot.isActive },
    });

    return NextResponse.json(slot);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
