import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import { requireCrmManager } from "@/lib/crm";
import { teamUserCreateSchema } from "@/lib/crm-schemas";

export async function GET() {
  const session = await requireCrmManager();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { role: { in: ["CRM_OWNER", "SALES_MANAGER", "SALES_REP"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLogin: true,
      mustChangePassword: true,
      _count: {
        select: {
          ownedCrmLeads: true,
          ownedCrmOpportunities: true,
          assignedCrmTasks: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await requireCrmManager();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = teamUserCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );

  const rawPassword = crypto.randomBytes(5).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      password: hashedPassword,
      role: parsed.data.role,
      isVerified: true,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  audit(req, {
    action: "CRM_TEAM_CREATE",
    entityType: "User",
    entityId: user.id,
    actor: actorOf(session),
    metadata: { role: user.role },
  });

  return NextResponse.json(
    { user, credentials: { email, password: rawPassword } },
    { status: 201 }
  );
}
