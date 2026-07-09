import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, canAccessOwner, resolveOwnerId } from "@/lib/crm";
import { contactUpdateSchema } from "@/lib/crm-schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const contact = await prisma.crmContact.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      opportunities: { orderBy: { createdAt: "desc" } },
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

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, contact.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(contact);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmContact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = contactUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, ...data } = parsed.data;
  const contact = await prisma.crmContact.update({
    where: { id },
    data: {
      ...data,
      ...(ownerId ? { ownerId: resolveOwnerId(session, ownerId) } : {}),
    },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  audit(req, {
    action: "CRM_CONTACT_UPDATE",
    entityType: "CrmContact",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmContact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.crmContact.delete({ where: { id } });

  audit(req, {
    action: "CRM_CONTACT_DELETE",
    entityType: "CrmContact",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json({ ok: true });
}
