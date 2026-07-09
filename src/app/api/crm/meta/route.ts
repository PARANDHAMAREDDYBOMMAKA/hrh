import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCrmUser,
  isCrmManager,
  ownerScope,
  CRM_STAGES,
  STAGE_META,
  LEAD_STATUSES,
  LEAD_SOURCES,
  ACTIVITY_TYPES,
  TASK_PRIORITIES,
} from "@/lib/crm";

export async function GET() {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = ownerScope(session);

  const [owners, accounts, contacts] = await Promise.all([
    isCrmManager(session.user.role)
      ? prisma.user.findMany({
          where: { role: { in: ["CRM_OWNER", "SALES_MANAGER", "SALES_REP"] } },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: "asc" },
        })
      : prisma.user.findMany({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true, role: true },
        }),
    prisma.crmAccount.findMany({
      where: scope,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.crmContact.findMany({
      where: scope,
      select: { id: true, firstName: true, lastName: true, accountId: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return NextResponse.json({
    owners,
    accounts,
    contacts,
    stages: CRM_STAGES.map((s) => ({ value: s, ...STAGE_META[s] })),
    leadStatuses: LEAD_STATUSES,
    leadSources: LEAD_SOURCES,
    activityTypes: ACTIVITY_TYPES,
    taskPriorities: TASK_PRIORITIES,
    isManager: isCrmManager(session.user.role),
    currentUserId: session.user.id,
  });
}
