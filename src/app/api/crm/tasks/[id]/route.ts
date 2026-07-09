import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, isCrmManager, parseDate } from "@/lib/crm";
import { taskUpdateSchema } from "@/lib/crm-schemas";

function canManageTask(
  session: { user: { id: string; role: string } },
  assigneeId: string
): boolean {
  return isCrmManager(session.user.role) || session.user.id === assigneeId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageTask(session, existing.assigneeId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = taskUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { assigneeId, dueDate, status, ...data } = parsed.data;
  const task = await prisma.crmTask.update({
    where: { id },
    data: {
      ...data,
      ...(status ? { status } : {}),
      ...(status === "DONE"
        ? { completedAt: new Date() }
        : status === "OPEN"
          ? { completedAt: null }
          : {}),
      ...(dueDate !== undefined ? { dueDate: parseDate(dueDate) ?? null } : {}),
      ...(assigneeId && isCrmManager(session.user.role) ? { assigneeId } : {}),
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  audit(req, {
    action: "CRM_TASK_UPDATE",
    entityType: "CrmTask",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json(task);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.crmTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageTask(session, existing.assigneeId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.crmTask.delete({ where: { id } });

  audit(req, {
    action: "CRM_TASK_DELETE",
    entityType: "CrmTask",
    entityId: id,
    actor: actorOf(session),
  });

  return NextResponse.json({ ok: true });
}
