import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, ownerScope, resolveOwnerId } from "@/lib/crm";
import { leadCreateSchema } from "@/lib/crm-schemas";

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = { ...ownerScope(session) };
  if (status) where.status = status;
  else where.status = { not: "CONVERTED" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.crmLead.findMany({
    where,
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = leadCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, ...data } = parsed.data;
  const lead = await prisma.crmLead.create({
    data: { ...data, ownerId: resolveOwnerId(session, ownerId) },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  audit(req, {
    action: "CRM_LEAD_CREATE",
    entityType: "CrmLead",
    entityId: lead.id,
    actor: actorOf(session),
  });

  return NextResponse.json(lead, { status: 201 });
}
