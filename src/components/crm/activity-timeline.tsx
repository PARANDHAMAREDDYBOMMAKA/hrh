"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone, Mail, Users, StickyNote, Send } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { relativeDate, ACTIVITY_META } from "@/lib/crm-ui";
import { Avatar, Select, Input } from "@/components/crm/ui";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Mail,
  Users,
  StickyNote,
};

export type ActivityItem = {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  occurredAt: string;
  owner: { id: string; name: string };
};

export function ActivityTimeline({
  activities,
  link,
  invalidateKey,
}: {
  activities: ActivityItem[];
  link: { leadId?: string; accountId?: string; contactId?: string; opportunityId?: string };
  invalidateKey: unknown[];
}) {
  const qc = useQueryClient();
  const [type, setType] = useState("NOTE");
  const [subject, setSubject] = useState("");

  const log = useMutation({
    mutationFn: () =>
      crmApi.post("/api/crm/activities", { type, subject, ...link }),
    onSuccess: () => {
      setSubject("");
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("Activity logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto">
          {Object.entries(ACTIVITY_META).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Log a call, email, note…"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && subject.trim()) log.mutate();
          }}
        />
        <button
          onClick={() => subject.trim() && log.mutate()}
          disabled={log.isPending || !subject.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-[13px] text-foreground/35 text-center py-6">No activity yet.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((a) => {
            const Icon = ICONS[ACTIVITY_META[a.type]?.icon] ?? StickyNote;
            return (
              <div key={a.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-black/4 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-foreground">{a.subject}</div>
                  {a.body && (
                    <div className="text-[12px] text-foreground/45 mt-0.5">{a.body}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar name={a.owner.name} className="w-4 h-4 text-[8px]" />
                    <span className="text-[11px] text-foreground/35">
                      {a.owner.name} · {relativeDate(a.occurredAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
