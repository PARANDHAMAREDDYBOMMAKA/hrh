import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, assigneeScope, isCrmManager, parseDate } from "@/lib/crm";
import { taskCreateSchema } from "@/lib/crm-schemas";

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const scopeMine = searchParams.get("mine") === "1";

  const where: Record<string, unknown> = scopeMine
    ? { assigneeId: session.user.id }
    : { ...assigneeScope(session) };
  if (status) where.status = status;

  for (const key of ["leadId", "accountId", "contactId", "opportunityId"]) {
    const v = searchParams.get(key);
    if (v) where[key] = v;
  }

  const tasks = await prisma.crmTask.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = taskCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { assigneeId, dueDate, ...data } = parsed.data;
  const resolvedAssignee =
    assigneeId && isCrmManager(session.user.role) ? assigneeId : session.user.id;

  const task = await prisma.crmTask.create({
    data: {
      ...data,
      dueDate: parseDate(dueDate),
      assigneeId: resolvedAssignee,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  audit(req, {
    action: "CRM_TASK_CREATE",
    entityType: "CrmTask",
    entityId: task.id,
    actor: actorOf(session),
  });

  return NextResponse.json(task, { status: 201 });
}
