import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, canAccessOwner, resolveOwnerId } from "@/lib/crm";
import { leadUpdateSchema } from "@/lib/crm-schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const lead = await prisma.crmLead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      activities: {
        include: { owner: { select: { id: true, name: true } } },
        orderBy: { occurredAt: "desc" },
      },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, lead.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(lead);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmLead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (existing.status === "CONVERTED")
    return NextResponse.json({ error: "Converted leads are read-only" }, { status: 409 });

  const parsed = leadUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, ...data } = parsed.data;
  const lead = await prisma.crmLead.update({
    where: { id },
    data: {
      ...data,
      ...(ownerId ? { ownerId: resolveOwnerId(session, ownerId) } : {}),
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  audit(req, {
    action: "CRM_LEAD_UPDATE",
    entityType: "CrmLead",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json(lead);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmLead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.crmLead.delete({ where: { id } });

  audit(req, {
    action: "CRM_LEAD_DELETE",
    entityType: "CrmLead",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json({ ok: true });
}
