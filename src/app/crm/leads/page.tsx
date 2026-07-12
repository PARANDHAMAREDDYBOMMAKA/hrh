"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, UserPlus, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import {
  money,
  LEAD_STATUS_META,
  LEAD_SOURCE_LABEL,
  STAGES,
} from "@/lib/crm-ui";
import { useCrmMeta } from "@/hooks/use-crm-meta";
import {
  Drawer,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Badge,
  Avatar,
  EmptyState,
  Spinner,
} from "@/components/crm/ui";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  source: string;
  status: string;
  estimatedValue: number | null;
  notes: string | null;
  createdAt: string;
  owner: { id: string; name: string };
};

const empty = {
  name: "",
  company: "",
  email: "",
  phone: "",
  title: "",
  source: "OTHER",
  status: "NEW",
  estimatedValue: "",
  notes: "",
  ownerId: "",
};

export default function LeadsPage() {
  const qc = useQueryClient();
  const { data: meta } = useCrmMeta();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [converting, setConverting] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["crm", "leads", statusFilter, q],
    queryFn: () =>
      crmApi.get(
        `/api/crm/leads?${new URLSearchParams({
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(q ? { q } : {}),
        })}`
      ),
  });

  const save = useMutation({
    mutationFn: (payload: typeof empty) => {
      const body = {
        ...payload,
        estimatedValue: payload.estimatedValue ? Number(payload.estimatedValue) : undefined,
        ownerId: payload.ownerId || undefined,
      };
      return editing
        ? crmApi.patch(`/api/crm/leads/${editing.id}`, body)
        : crmApi.post("/api/crm/leads", body);
    },
    onSuccess: () => {
      toast.success(editing ? "Lead updated" : "Lead created");
      qc.invalidateQueries({ queryKey: ["crm", "leads"] });
      qc.invalidateQueries({ queryKey: ["crm", "meta"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => crmApi.del(`/api/crm/leads/${id}`),
    onSuccess: () => {
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: ["crm", "leads"] });
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setForm({ ...empty });
    setFormOpen(true);
  }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm({
      name: lead.name,
      company: lead.company ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      title: lead.title ?? "",
      source: lead.source,
      status: lead.status,
      estimatedValue: lead.estimatedValue?.toString() ?? "",
      notes: lead.notes ?? "",
      ownerId: lead.owner.id,
    });
    setFormOpen(true);
  }
  function close() {
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Leads</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">
            Capture prospects, qualify, then convert
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25" />
          <Input
            placeholder="Search leads…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        >
          <option value="">All statuses</option>
          {(meta?.leadStatuses ?? []).map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_META[s]?.label ?? s}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : leads.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/5 shadow-soft">
          <EmptyState
            icon={<UserPlus className="w-10 h-10" />}
            title="No leads yet"
            hint="Add your first lead to start building your pipeline."
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-foreground/40 border-b border-black/4">
                  <th className="font-medium px-5 py-3">Name</th>
                  <th className="font-medium px-3 py-3">Company</th>
                  <th className="font-medium px-3 py-3">Status</th>
                  <th className="font-medium px-3 py-3">Source</th>
                  <th className="font-medium px-3 py-3">Value</th>
                  <th className="font-medium px-3 py-3">Owner</th>
                  <th className="font-medium px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const meta = LEAD_STATUS_META[lead.status];
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-black/3 last:border-0 hover:bg-black/[0.015] cursor-pointer"
                      onClick={() => openEdit(lead)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground">{lead.name}</div>
                        {lead.title && (
                          <div className="text-[11px] text-foreground/35">{lead.title}</div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-foreground/60">{lead.company || "—"}</td>
                      <td className="px-3 py-3.5">
                        <Badge className={meta?.className}>{meta?.label ?? lead.status}</Badge>
                      </td>
                      <td className="px-3 py-3.5 text-foreground/50">
                        {LEAD_SOURCE_LABEL[lead.source] ?? lead.source}
                      </td>
                      <td className="px-3 py-3.5 text-foreground/60">
                        {lead.estimatedValue ? money(lead.estimatedValue) : "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={lead.owner.name} className="w-6 h-6" />
                          <span className="text-foreground/50">{lead.owner.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        {lead.status !== "CONVERTED" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConverting(lead);
                            }}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-600 hover:text-orange-700"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={close}
        title={editing ? "Edit Lead" : "New Lead"}
        footer={
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              disabled={save.isPending || !form.name.trim()}
              onClick={() => save.mutate(form)}
            >
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Create lead"}
            </Button>
            {editing && (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Delete this lead?")) remove.mutate(editing.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <Select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {(meta?.leadSources ?? []).map((s) => (
                  <option key={s} value={s}>
                    {LEAD_SOURCE_LABEL[s] ?? s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {(meta?.leadStatuses ?? [])
                  .filter((s) => s !== "CONVERTED")
                  .map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_META[s]?.label ?? s}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <Field label="Estimated Value (₹)">
            <Input
              type="number"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </Field>
          {meta?.isManager && (
            <Field label="Owner">
              <Select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="">Me</option>
                {meta.owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>
      </Drawer>

      <ConvertDrawer lead={converting} onClose={() => setConverting(null)} />
    </div>
  );
}

function ConvertDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [oppName, setOppName] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("PROSPECTING");

  const convert = useMutation({
    mutationFn: () =>
      crmApi.post(`/api/crm/leads/${lead!.id}/convert`, {
        createOpportunity,
        opportunityName: oppName || undefined,
        amount: amount ? Number(amount) : undefined,
        stage,
      }),
    onSuccess: () => {
      toast.success("Lead converted to account, contact & opportunity");
      qc.invalidateQueries({ queryKey: ["crm"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Drawer
      open={!!lead}
      onClose={onClose}
      title="Convert Lead"
      footer={
        <Button
          className="w-full"
          disabled={convert.isPending}
          onClick={() => convert.mutate()}
        >
          {convert.isPending ? "Converting…" : "Convert lead"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      }
    >
      {lead && (
        <div className="space-y-5">
          <div className="rounded-xl bg-white border border-black/5 p-4 text-[13px] space-y-1.5">
            <div className="font-semibold text-foreground">{lead.name}</div>
            <div className="text-foreground/50">{lead.company || "No company"}</div>
            <p className="text-[12px] text-foreground/40 pt-1">
              This creates an <b>Account</b>, a <b>Contact</b>
              {createOpportunity && (
                <>
                  {" "}
                  and an <b>Opportunity</b>
                </>
              )}
              , then marks the lead as converted (read-only).
            </p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={createOpportunity}
              onChange={(e) => setCreateOpportunity(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-[13px] font-medium text-foreground/70">
              Create an opportunity
            </span>
          </label>

          {createOpportunity && (
            <div className="space-y-4">
              <Field label="Opportunity name">
                <Input
                  value={oppName}
                  onChange={(e) => setOppName(e.target.value)}
                  placeholder={`${lead.company || lead.name} — New Deal`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={lead.estimatedValue?.toString() ?? "0"}
                  />
                </Field>
                <Field label="Stage">
                  <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                    {STAGES.filter((s) => s.type === "OPEN").map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
