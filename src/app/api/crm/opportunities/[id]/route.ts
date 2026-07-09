import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import {
  requireCrmUser,
  canAccessOwner,
  resolveOwnerId,
  stageProbability,
  parseDate,
  STAGE_META,
  type CrmStageName,
} from "@/lib/crm";
import { opportunityUpdateSchema } from "@/lib/crm-schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const opportunity = await prisma.crmOpportunity.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
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

  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, opportunity.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(opportunity);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmOpportunity.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = opportunityUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, expectedCloseDate, probability, stage, ...data } = parsed.data;
  const nextStage = (stage ?? existing.stage) as CrmStageName;
  const stageChanged = stage && stage !== existing.stage;

  const opportunity = await prisma.crmOpportunity.update({
    where: { id },
    data: {
      ...data,
      ...(stage ? { stage } : {}),
      ...(probability !== undefined
        ? { probability }
        : stageChanged
          ? { probability: stageProbability(nextStage) }
          : {}),
      ...(stageChanged
        ? {
            closedAt: STAGE_META[nextStage].type === "OPEN" ? null : new Date(),
          }
        : {}),
      ...(expectedCloseDate !== undefined
        ? { expectedCloseDate: parseDate(expectedCloseDate) ?? null }
        : {}),
      ...(ownerId ? { ownerId: resolveOwnerId(session, ownerId) } : {}),
    },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  audit(req, {
    action: "CRM_OPPORTUNITY_UPDATE",
    entityType: "CrmOpportunity",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json(opportunity);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmOpportunity.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, existing.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.crmOpportunity.delete({ where: { id } });

  audit(req, {
    action: "CRM_OPPORTUNITY_DELETE",
    entityType: "CrmOpportunity",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json({ ok: true });
}
