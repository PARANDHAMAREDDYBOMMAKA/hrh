import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmUser, ownerScope, resolveOwnerId } from "@/lib/crm";
import { contactCreateSchema } from "@/lib/crm-schemas";

export async function GET(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const accountId = searchParams.get("accountId");

  const where: Record<string, unknown> = { ...ownerScope(session) };
  if (accountId) where.accountId = accountId;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.crmContact.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = contactCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ownerId, ...data } = parsed.data;
  const contact = await prisma.crmContact.create({
    data: { ...data, ownerId: resolveOwnerId(session, ownerId) },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  audit(req, {
    action: "CRM_CONTACT_CREATE",
    entityType: "CrmContact",
    entityId: contact.id,
    actor: actorOf(session),
  });

  return NextResponse.json(contact, { status: 201 });
}
