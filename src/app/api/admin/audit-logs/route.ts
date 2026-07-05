import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const action = searchParams.get("action")?.trim();
  const status = searchParams.get("status")?.trim();
  const search = searchParams.get("search")?.trim();

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { userEmail: { contains: search, mode: "insensitive" } },
            { ipAddress: { contains: search } },
            { path: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search } },
          ],
        }
      : {}),
  };

  const [logs, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  audit(req, {
    action: "AUDIT_LOGS_VIEW",
    entityType: "AuditLog",
    actor: actorOf(session),
  });

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    actions: actions.map((a) => a.action),
  });
}
