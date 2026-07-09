import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmUser, ownerScope, CRM_STAGES, STAGE_META } from "@/lib/crm";

export async function GET() {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opportunities = await prisma.crmOpportunity.findMany({
    where: { ...ownerScope(session) },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const columns = CRM_STAGES.map((stage) => {
    const items = opportunities.filter((o) => o.stage === stage);
    return {
      stage,
      label: STAGE_META[stage].label,
      type: STAGE_META[stage].type,
      probability: STAGE_META[stage].probability,
      count: items.length,
      total: items.reduce((s, o) => s + o.amount, 0),
      opportunities: items,
    };
  });

  return NextResponse.json({ columns });
}
