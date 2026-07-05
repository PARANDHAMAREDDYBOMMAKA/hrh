import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditActor = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AuditEntry = {
  action: string;
  entityType?: string;
  entityId?: string | null;
  status?: "SUCCESS" | "FAILURE";
  metadata?: Prisma.InputJsonValue;
  actor?: AuditActor | null;
};

type AuditRecord = AuditEntry & {
  method: string;
  path: string;
  ipAddress: string;
  userAgent?: string | null;
};

export function actorOf(session: {
  user: { id: string; email?: string | null; role?: string | null };
}): AuditActor {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    role: session.user.role ?? null,
  };
}

export function ipFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

async function writeAuditLog(record: AuditRecord): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: record.action,
        entityType: record.entityType ?? null,
        entityId: record.entityId ?? null,
        status: record.status ?? "SUCCESS",
        metadata: record.metadata ?? Prisma.JsonNull,
        userId: record.actor?.id ?? null,
        userEmail: record.actor?.email ?? null,
        userRole: record.actor?.role ?? null,
        method: record.method,
        path: record.path,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log:", err);
  }
}

export function audit(req: Request, entry: AuditEntry): void {
  try {
    const record: AuditRecord = {
      ...entry,
      method: req.method,
      path: new URL(req.url).pathname,
      ipAddress: ipFromHeaders(req.headers),
      userAgent: req.headers.get("user-agent"),
    };
    after(() => writeAuditLog(record));
  } catch (err) {
    console.error("[audit] failed to record audit log:", err);
  }
}

export async function auditDirect(
  entry: AuditEntry & {
    method?: string;
    path?: string;
    ipAddress?: string;
    userAgent?: string | null;
  }
): Promise<void> {
  await writeAuditLog({
    ...entry,
    method: entry.method ?? "POST",
    path: entry.path ?? "/api/auth/callback/credentials",
    ipAddress: entry.ipAddress ?? "unknown",
    userAgent: entry.userAgent ?? null,
  });
}

export function ipFromHeaderObject(
  headers: Record<string, string | string[] | undefined> | undefined
): string {
  if (!headers) return "unknown";
  const forwarded = headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (value) return value.split(",")[0].trim();
  const real = headers["x-real-ip"];
  const realValue = Array.isArray(real) ? real[0] : real;
  return realValue?.trim() || "unknown";
}
