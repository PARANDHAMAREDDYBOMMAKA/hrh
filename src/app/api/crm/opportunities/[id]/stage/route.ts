import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import {
  requireCrmUser,
  canAccessOwner,
  stageProbability,
  STAGE_META,
  type CrmStageName,
} from "@/lib/crm";
import { stageMoveSchema } from "@/lib/crm-schemas";

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

  const parsed = stageMoveSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const stage = parsed.data.stage as CrmStageName;
  const opportunity = await prisma.crmOpportunity.update({
    where: { id },
    data: {
      stage,
      probability: stageProbability(stage),
      closedAt: STAGE_META[stage].type === "OPEN" ? null : new Date(),
    },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  audit(req, {
    action: "CRM_OPPORTUNITY_STAGE",
    entityType: "CrmOpportunity",
    entityId: id,
    actor: actorOf(session),
    metadata: { from: existing.stage, to: stage },
  });

  return NextResponse.json(opportunity);
}
