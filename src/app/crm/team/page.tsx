"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, Copy, Check, ShieldCheck } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { shortDate } from "@/lib/crm-ui";
import {
  Drawer,
  Field,
  Input,
  Select,
  Button,
  Badge,
  Avatar,
  EmptyState,
  Spinner,
} from "@/components/crm/ui";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
  _count: { ownedCrmLeads: number; ownedCrmOpportunities: number; assignedCrmTasks: number };
};

const ROLE_LABEL: Record<string, string> = {
  CRM_OWNER: "Owner",
  SALES_MANAGER: "Manager",
  SALES_REP: "Rep",
};

export default function TeamPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "SALES_REP" });
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["crm", "team"],
    queryFn: () => crmApi.get("/api/crm/team"),
  });

  const create = useMutation({
    mutationFn: () => crmApi.post("/api/crm/team", form),
    onSuccess: (data: { credentials: { email: string; password: string } }) => {
      toast.success("Team member added");
      qc.invalidateQueries({ queryKey: ["crm", "team"] });
      qc.invalidateQueries({ queryKey: ["crm", "meta"] });
      setFormOpen(false);
      setForm({ name: "", email: "", role: "SALES_REP" });
      setCreds(data.credentials);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyCreds() {
    if (!creds) return;
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Team</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">
            Managers see everything; reps see only their own records
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : members.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/4">
          <EmptyState icon={<Users className="w-10 h-10" />} title="No team members yet" />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-black/4 overflow-hidden divide-y divide-black/4">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar name={m.name} className="w-10 h-10 text-[13px]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[14px] text-foreground flex items-center gap-2">
                  {m.name}
                  {m.role === "CRM_OWNER" && <ShieldCheck className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="text-[12px] text-foreground/40">{m.email}</div>
              </div>
              <div className="hidden md:flex items-center gap-5 text-[12px] text-foreground/45">
                <span>{m._count.ownedCrmLeads} leads</span>
                <span>{m._count.ownedCrmOpportunities} deals</span>
                <span>
                  {m.lastLogin ? `Active ${shortDate(m.lastLogin)}` : "Never logged in"}
                </span>
              </div>
              <Badge
                className={
                  m.role === "CRM_OWNER"
                    ? "bg-orange-50 text-orange-600"
                    : m.role === "SALES_MANAGER"
                      ? "bg-violet-50 text-violet-600"
                      : "bg-black/5 text-foreground/50"
                }
              >
                {ROLE_LABEL[m.role] ?? m.role}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Team Member"
        footer={
          <Button
            className="w-full"
            disabled={create.isPending || !form.name.trim() || !form.email.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create member"}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="SALES_REP">Sales Rep — sees only their own records</option>
              <option value="SALES_MANAGER">Sales Manager — sees all records</option>
            </Select>
          </Field>
          <p className="text-[12px] text-foreground/40">
            A temporary password is generated. The member must change it on first login.
          </p>
        </div>
      </Drawer>

      <Drawer open={!!creds} onClose={() => setCreds(null)} title="Member Credentials">
        {creds && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] text-amber-700">
              Shown once. Share these with the member securely.
            </div>
            <div className="rounded-xl bg-white border border-black/8 divide-y divide-black/5">
              <div className="px-4 py-3">
                <div className="text-[11px] text-foreground/40">Email</div>
                <div className="text-[14px] font-medium text-foreground">{creds.email}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-[11px] text-foreground/40">Temporary password</div>
                <div className="text-[14px] font-mono font-medium text-foreground">
                  {creds.password}
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={copyCreds}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy credentials"}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
