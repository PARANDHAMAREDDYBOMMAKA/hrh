import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, ownerScope, resolveOwnerId } from "@/lib/crm";
import { accountCreateSchema } from "@/lib/crm-schemas";

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = { ...ownerScope(session) };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }

  const accounts = await prisma.crmAccount.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { contacts: true, opportunities: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = accountCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, ...data } = parsed.data;
  const account = await prisma.crmAccount.create({
    data: { ...data, ownerId: resolveOwnerId(session, ownerId) },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  audit(req, {
    action: "CRM_ACCOUNT_CREATE",
    entityType: "CrmAccount",
    entityId: account.id,
    actor: actorOf(session),
  });

  return NextResponse.json(account, { status: 201 });
}
