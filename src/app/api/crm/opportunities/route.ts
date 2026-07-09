import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import {
  requireCrmUser,
  ownerScope,
  resolveOwnerId,
  stageProbability,
  parseDate,
  type CrmStageName,
} from "@/lib/crm";
import { opportunityCreateSchema } from "@/lib/crm-schemas";

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const accountId = searchParams.get("accountId");

  const where: Record<string, unknown> = { ...ownerScope(session) };
  if (stage) where.stage = stage;
  if (accountId) where.accountId = accountId;

  const opportunities = await prisma.crmOpportunity.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(opportunities);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = opportunityCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, expectedCloseDate, probability, stage, ...data } = parsed.data;
  const opportunity = await prisma.crmOpportunity.create({
    data: {
      ...data,
      stage,
      probability: probability ?? stageProbability(stage as CrmStageName),
      expectedCloseDate: parseDate(expectedCloseDate),
      ownerId: resolveOwnerId(session, ownerId),
    },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  audit(req, {
    action: "CRM_OPPORTUNITY_CREATE",
    entityType: "CrmOpportunity",
    entityId: opportunity.id,
    actor: actorOf(session),
  });

  return NextResponse.json(opportunity, { status: 201 });
}
