import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmUser, ownerScope, CRM_STAGES, STAGE_META, OPEN_STAGES } from "@/lib/crm";

export async function GET() {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = ownerScope(session);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [opps, leadGroups, wonThisMonth, activityCount, openTasks, overdueTasks] =
    await Promise.all([
      prisma.crmOpportunity.findMany({
        where: scope,
        select: { stage: true, amount: true, probability: true, closedAt: true },
      }),
      prisma.crmLead.groupBy({
        by: ["status"],
        where: scope,
        _count: { _all: true },
      }),
      prisma.crmOpportunity.aggregate({
        where: { ...scope, stage: "CLOSED_WON", closedAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.crmActivity.count({
        where: { ...scope, occurredAt: { gte: last30 } },
      }),
      prisma.crmTask.count({
        where: {
          ...(scope.ownerId ? { assigneeId: scope.ownerId } : {}),
          status: "OPEN",
        },
      }),
      prisma.crmTask.count({
        where: {
          ...(scope.ownerId ? { assigneeId: scope.ownerId } : {}),
          status: "OPEN",
          dueDate: { lt: now },
        },
      }),
    ]);

  const openOpps = opps.filter((o) => STAGE_META[o.stage].type === "OPEN");
  const wonOpps = opps.filter((o) => o.stage === "CLOSED_WON");
  const lostOpps = opps.filter((o) => o.stage === "CLOSED_LOST");

  const pipelineValue = openOpps.reduce((s, o) => s + o.amount, 0);
  const weightedValue = openOpps.reduce(
    (s, o) => s + (o.amount * o.probability) / 100,
    0
  );
  const wonValue = wonOpps.reduce((s, o) => s + o.amount, 0);
  const closedCount = wonOpps.length + lostOpps.length;
  const winRate = closedCount ? Math.round((wonOpps.length / closedCount) * 100) : 0;

  const byStage = CRM_STAGES.map((stage) => {
    const items = opps.filter((o) => o.stage === stage);
    return {
      stage,
      label: STAGE_META[stage].label,
      count: items.length,
      value: items.reduce((s, o) => s + o.amount, 0),
    };
  });

  const leadsByStatus = leadGroups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));

  return NextResponse.json({
    kpis: {
      pipelineValue,
      weightedValue,
      openCount: openOpps.length,
      wonValue,
      wonCount: wonOpps.length,
      wonThisMonthValue: wonThisMonth._sum.amount ?? 0,
      wonThisMonthCount: wonThisMonth._count._all,
      winRate,
      activityCount,
      openTasks,
      overdueTasks,
    },
    byStage,
    openStages: OPEN_STAGES,
    leadsByStatus,
  });
}
