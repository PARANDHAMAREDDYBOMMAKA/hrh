export type StageValue =
  | "PROSPECTING"
  | "QUALIFICATION"
  | "NEEDS_ANALYSIS"
  | "VALUE_PROPOSITION"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export const STAGES: {
  value: StageValue;
  label: string;
  probability: number;
  type: "OPEN" | "WON" | "LOST";
}[] = [
  { value: "PROSPECTING", label: "Prospecting", probability: 10, type: "OPEN" },
  { value: "QUALIFICATION", label: "Qualification", probability: 20, type: "OPEN" },
  { value: "NEEDS_ANALYSIS", label: "Needs Analysis", probability: 40, type: "OPEN" },
  { value: "VALUE_PROPOSITION", label: "Value Proposition", probability: 50, type: "OPEN" },
  { value: "PROPOSAL", label: "Proposal", probability: 65, type: "OPEN" },
  { value: "NEGOTIATION", label: "Negotiation", probability: 80, type: "OPEN" },
  { value: "CLOSED_WON", label: "Closed Won", probability: 100, type: "WON" },
  { value: "CLOSED_LOST", label: "Closed Lost", probability: 0, type: "LOST" },
];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.value, s.label])
);

export const LEAD_STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-blue-50 text-blue-600" },
  CONTACTED: { label: "Contacted", className: "bg-amber-50 text-amber-600" },
  QUALIFIED: { label: "Qualified", className: "bg-emerald-50 text-emerald-600" },
  UNQUALIFIED: { label: "Unqualified", className: "bg-rose-50 text-rose-600" },
  CONVERTED: { label: "Converted", className: "bg-violet-50 text-violet-600" },
};

export const LEAD_SOURCE_LABEL: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  COLD_CALL: "Cold Call",
  EVENT: "Event",
  PARTNER: "Partner",
  OTHER: "Other",
};

export const PRIORITY_META: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-black/5 text-foreground/50" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-600" },
  HIGH: { label: "High", className: "bg-rose-50 text-rose-600" },
};

export const ACTIVITY_META: Record<string, { label: string; icon: string }> = {
  CALL: { label: "Call", icon: "Phone" },
  EMAIL: { label: "Email", icon: "Mail" },
  MEETING: { label: "Meeting", icon: "Users" },
  NOTE: { label: "Note", icon: "StickyNote" },
};

export function stageBadgeClass(stage: string): string {
  const meta = STAGES.find((s) => s.value === stage);
  if (!meta) return "bg-black/5 text-foreground/50";
  if (meta.type === "WON") return "bg-emerald-50 text-emerald-600";
  if (meta.type === "LOST") return "bg-rose-50 text-rose-600";
  return "bg-orange-50 text-orange-600";
}

export function money(n: number | null | undefined): string {
  const v = n ?? 0;
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function shortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
