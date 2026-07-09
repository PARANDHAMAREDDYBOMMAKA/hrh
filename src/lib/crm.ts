import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const CRM_ROLES = ["CRM_OWNER", "SALES_MANAGER", "SALES_REP"] as const;
export const CRM_MANAGER_ROLES = ["CRM_OWNER", "SALES_MANAGER"] as const;

export type CrmSession = Awaited<ReturnType<typeof getServerSession>> & {
  user: { id: string; email: string; name: string; role: string };
};

export function isCrmUser(role?: string | null): boolean {
  return !!role && (CRM_ROLES as readonly string[]).includes(role);
}

export function isCrmManager(role?: string | null): boolean {
  return !!role && (CRM_MANAGER_ROLES as readonly string[]).includes(role);
}

export async function requireCrmUser(): Promise<CrmSession | null> {
  const session = await getServerSession(authOptions);
  if (!session || !isCrmUser(session.user.role)) return null;
  return session as CrmSession;
}

export async function requireCrmManager(): Promise<CrmSession | null> {
  const session = await getServerSession(authOptions);
  if (!session || !isCrmManager(session.user.role)) return null;
  return session as CrmSession;
}

export function ownerScope(session: CrmSession): { ownerId?: string } {
  return isCrmManager(session.user.role) ? {} : { ownerId: session.user.id };
}

export function assigneeScope(session: CrmSession): { assigneeId?: string } {
  return isCrmManager(session.user.role) ? {} : { assigneeId: session.user.id };
}

export function canAccessOwner(
  session: CrmSession,
  ownerId: string | null | undefined
): boolean {
  return isCrmManager(session.user.role) || session.user.id === ownerId;
}

export function resolveOwnerId(
  session: CrmSession,
  requestedOwnerId?: string | null
): string {
  if (requestedOwnerId && isCrmManager(session.user.role)) return requestedOwnerId;
  return session.user.id;
}

export function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export const CRM_STAGES = [
  "PROSPECTING",
  "QUALIFICATION",
  "NEEDS_ANALYSIS",
  "VALUE_PROPOSITION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

export type CrmStageName = (typeof CRM_STAGES)[number];

type StageMeta = {
  label: string;
  probability: number;
  type: "OPEN" | "WON" | "LOST";
};

export const STAGE_META: Record<CrmStageName, StageMeta> = {
  PROSPECTING: { label: "Prospecting", probability: 10, type: "OPEN" },
  QUALIFICATION: { label: "Qualification", probability: 20, type: "OPEN" },
  NEEDS_ANALYSIS: { label: "Needs Analysis", probability: 40, type: "OPEN" },
  VALUE_PROPOSITION: { label: "Value Proposition", probability: 50, type: "OPEN" },
  PROPOSAL: { label: "Proposal", probability: 65, type: "OPEN" },
  NEGOTIATION: { label: "Negotiation", probability: 80, type: "OPEN" },
  CLOSED_WON: { label: "Closed Won", probability: 100, type: "WON" },
  CLOSED_LOST: { label: "Closed Lost", probability: 0, type: "LOST" },
};

export function stageProbability(stage: CrmStageName): number {
  return STAGE_META[stage].probability;
}

export function isOpenStage(stage: CrmStageName): boolean {
  return STAGE_META[stage].type === "OPEN";
}

export const OPEN_STAGES = CRM_STAGES.filter((s) => STAGE_META[s].type === "OPEN");

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
] as const;

export const LEAD_SOURCES = [
  "WEBSITE",
  "REFERRAL",
  "COLD_CALL",
  "EVENT",
  "PARTNER",
  "OTHER",
] as const;

export const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
