"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { money, STAGES } from "@/lib/crm-ui";
import { useCrmMeta } from "@/hooks/use-crm-meta";
import {
  Drawer,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Avatar,
  Spinner,
} from "@/components/crm/ui";

type Opp = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  owner: { id: string; name: string };
  account: { id: string; name: string } | null;
};

type Column = {
  stage: string;
  label: string;
  type: string;
  probability: number;
  count: number;
  total: number;
  opportunities: Opp[];
};

const emptyOpp = {
  name: "",
  accountId: "",
  contactId: "",
  stage: "PROSPECTING",
  amount: "",
  expectedCloseDate: "",
  notes: "",
  ownerId: "",
};

export default function PipelinePage() {
  const qc = useQueryClient();
  const { data: meta } = useCrmMeta();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyOpp });

  const { data, isLoading } = useQuery<{ columns: Column[] }>({
    queryKey: ["crm", "pipeline"],
    queryFn: () => crmApi.get("/api/crm/pipeline"),
  });

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      crmApi.patch(`/api/crm/opportunities/${id}/stage`, { stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm", "pipeline"] });
      qc.invalidateQueries({ queryKey: ["crm", "reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: () =>
      crmApi.post("/api/crm/opportunities", {
        ...form,
        amount: form.amount ? Number(form.amount) : 0,
        contactId: form.contactId || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        ownerId: form.ownerId || undefined,
      }),
    onSuccess: () => {
      toast.success("Opportunity created");
      qc.invalidateQueries({ queryKey: ["crm", "pipeline"] });
      qc.invalidateQueries({ queryKey: ["crm", "reports"] });
      setFormOpen(false);
      setForm({ ...emptyOpp });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stageIndex = (s: string) => STAGES.findIndex((x) => x.value === s);

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Pipeline</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">
            Drag deals forward through your sales stages
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          disabled={!meta?.accounts.length}
        >
          <Plus className="w-4 h-4" />
          New Opportunity
        </Button>
      </div>

      {!meta?.accounts.length && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[13px] text-amber-700">
          Create an account first (or convert a lead) before adding opportunities.
        </div>
      )}

      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <div className="flex gap-3 min-w-max">
          {data.columns.map((col) => (
            <div key={col.stage} className="w-72 shrink-0">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <span className="text-[12px] font-bold text-foreground/70 uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="text-[11px] text-foreground/35">{col.count}</span>
              </div>
              <div className="text-[11px] font-semibold text-foreground/40 px-1 mb-2">
                {money(col.total)}
              </div>
              <div className="space-y-2 min-h-[80px]">
                {col.opportunities.map((opp) => {
                  const idx = stageIndex(opp.stage);
                  return (
                    <div
                      key={opp.id}
                      className="rounded-xl bg-white border border-black/5 p-3.5 hover:border-black/15 transition group"
                    >
                      <div className="font-semibold text-[13px] text-foreground leading-tight">
                        {opp.name}
                      </div>
                      {opp.account && (
                        <div className="text-[11px] text-foreground/40 mt-0.5">
                          {opp.account.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[13px] font-bold text-foreground">
                          {money(opp.amount)}
                        </span>
                        <Avatar name={opp.owner.name} className="w-6 h-6" />
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/4 opacity-0 group-hover:opacity-100 transition">
                        <button
                          disabled={idx <= 0 || moveStage.isPending}
                          onClick={() =>
                            moveStage.mutate({ id: opp.id, stage: STAGES[idx - 1].value })
                          }
                          className="text-foreground/30 hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-foreground/30">
                          {opp.probability}%
                        </span>
                        <button
                          disabled={idx >= STAGES.length - 1 || moveStage.isPending}
                          onClick={() =>
                            moveStage.mutate({ id: opp.id, stage: STAGES[idx + 1].value })
                          }
                          className="text-foreground/30 hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Opportunity"
        footer={
          <Button
            className="w-full"
            disabled={create.isPending || !form.name.trim() || !form.accountId}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create opportunity"}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Deal name"
            />
          </Field>
          <Field label="Account" required>
            <Select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              <option value="">Select account…</option>
              {(meta?.accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Stage">
              <Select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Expected close date">
            <Input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
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
    </div>
  );
}
