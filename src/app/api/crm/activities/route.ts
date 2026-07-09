import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, canAccessOwner, parseDate } from "@/lib/crm";
import { activityCreateSchema } from "@/lib/crm-schemas";

async function linkedOwnerId(input: {
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
}): Promise<string | null | undefined> {
  if (input.leadId)
    return (await prisma.crmLead.findUnique({ where: { id: input.leadId }, select: { ownerId: true } }))?.ownerId;
  if (input.accountId)
    return (await prisma.crmAccount.findUnique({ where: { id: input.accountId }, select: { ownerId: true } }))?.ownerId;
  if (input.contactId)
    return (await prisma.crmContact.findUnique({ where: { id: input.contactId }, select: { ownerId: true } }))?.ownerId;
  if (input.opportunityId)
    return (await prisma.crmOpportunity.findUnique({ where: { id: input.opportunityId }, select: { ownerId: true } }))?.ownerId;
  return undefined;
}

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};
  for (const key of ["leadId", "accountId", "contactId", "opportunityId"]) {
    const v = searchParams.get(key);
    if (v) where[key] = v;
  }

  const activities = await prisma.crmActivity.findMany({
    where,
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = activityCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const owner = await linkedOwnerId(parsed.data);
  if (owner && !canAccessOwner(session, owner))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { occurredAt, ...data } = parsed.data;
  const activity = await prisma.crmActivity.create({
    data: {
      ...data,
      occurredAt: parseDate(occurredAt) ?? new Date(),
      ownerId: session.user.id,
    },
    include: { owner: { select: { id: true, name: true } } },
  });

  audit(req, {
    action: "CRM_ACTIVITY_LOG",
    entityType: "CrmActivity",
    entityId: activity.id,
    actor: actorOf(session),
  });

  return NextResponse.json(activity, { status: 201 });
}
