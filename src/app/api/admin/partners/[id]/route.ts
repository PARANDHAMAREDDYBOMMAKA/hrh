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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  audit(req, {
    action: "PARTNER_VIEW",
    entityType: "Partner",
    entityId: partner.id,
    actor: actorOf(session),
  });

  return NextResponse.json(partner);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const key of ["name", "address", "city", "contactPerson", "phone"]) {
    if (typeof body[key] === "string") data[key] = body[key].trim();
  }
  if (body.commissionRate !== undefined) data.commissionRate = parseFloat(body.commissionRate) || 0;
  if (body.totalRooms !== undefined) data.totalRooms = parseInt(body.totalRooms) || 0;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const partner = await prisma.partner.update({ where: { id }, data });

  audit(req, {
    action: "PARTNER_UPDATE",
    entityType: "Partner",
    entityId: partner.id,
    actor: actorOf(session),
    metadata: { changes: data as Record<string, string | number | boolean> },
  });

  return NextResponse.json(partner);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id }, select: { name: true, email: true } });
  await prisma.partner.delete({ where: { id } });

  audit(req, {
    action: "PARTNER_DELETE",
    entityType: "Partner",
    entityId: id,
    actor: actorOf(session),
    metadata: { name: partner?.name ?? null, email: partner?.email ?? null },
  });

  return NextResponse.json({ success: true });
}
