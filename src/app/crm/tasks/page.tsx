"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CheckSquare, Square, Trash2 } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { shortDate, PRIORITY_META } from "@/lib/crm-ui";
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

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  assignee: { id: string; name: string };
  account: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
  lead: { id: string; name: string } | null;
};

const empty = {
  title: "",
  description: "",
  dueDate: "",
  priority: "MEDIUM",
  assigneeId: "",
  accountId: "",
  opportunityId: "",
};

export default function TasksPage() {
  const qc = useQueryClient();
  const { data: meta } = useCrmMeta();
  const [filter, setFilter] = useState<"OPEN" | "DONE" | "">("OPEN");
  const [scope, setScope] = useState<"all" | "mine">("mine");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["crm", "tasks", filter, scope],
    queryFn: () =>
      crmApi.get(
        `/api/crm/tasks?${new URLSearchParams({
          ...(filter ? { status: filter } : {}),
          ...(scope === "mine" ? { mine: "1" } : {}),
        })}`
      ),
  });

  const create = useMutation({
    mutationFn: () =>
      crmApi.post("/api/crm/tasks", {
        ...form,
        dueDate: form.dueDate || undefined,
        assigneeId: form.assigneeId || undefined,
        accountId: form.accountId || undefined,
        opportunityId: form.opportunityId || undefined,
      }),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["crm", "tasks"] });
      qc.invalidateQueries({ queryKey: ["crm", "reports"] });
      setFormOpen(false);
      setForm({ ...empty });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (t: Task) =>
      crmApi.patch(`/api/crm/tasks/${t.id}`, {
        status: t.status === "DONE" ? "OPEN" : "DONE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm", "tasks"] });
      qc.invalidateQueries({ queryKey: ["crm", "reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => crmApi.del(`/api/crm/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm", "tasks"] });
      qc.invalidateQueries({ queryKey: ["crm", "reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkLabel = (t: Task) =>
    t.opportunity?.name || t.account?.name || t.lead?.name || null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Tasks</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">Follow-ups and to-dos</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-xl bg-black/4 p-1">
          {(["OPEN", "DONE", ""] as const).map((f) => (
            <button
              key={f || "all"}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                filter === f ? "bg-white text-foreground shadow-sm" : "text-foreground/40"
              }`}
            >
              {f === "OPEN" ? "Open" : f === "DONE" ? "Done" : "All"}
            </button>
          ))}
        </div>
        {meta?.isManager && (
          <div className="inline-flex rounded-xl bg-black/4 p-1">
            {(["mine", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                  scope === s ? "bg-white text-foreground shadow-sm" : "text-foreground/40"
                }`}
              >
                {s === "mine" ? "My tasks" : "Team"}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/4">
          <EmptyState
            icon={<CheckSquare className="w-10 h-10" />}
            title="No tasks here"
            hint="Create a follow-up task to stay on top of your deals."
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-black/4 overflow-hidden divide-y divide-black/4">
          {tasks.map((t) => {
            const done = t.status === "DONE";
            const overdue = !done && t.dueDate && new Date(t.dueDate) < new Date();
            const p = PRIORITY_META[t.priority];
            return (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 group">
                <button
                  onClick={() => toggle.mutate(t)}
                  className="text-foreground/30 hover:text-orange-500 shrink-0"
                >
                  {done ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[14px] font-medium ${done ? "text-foreground/35 line-through" : "text-foreground"}`}
                  >
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-foreground/40">
                    {linkLabel(t) && <span>{linkLabel(t)}</span>}
                    {t.dueDate && (
                      <span className={overdue ? "text-rose-500 font-semibold" : ""}>
                        Due {shortDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={p?.className}>{p?.label ?? t.priority}</Badge>
                <Avatar name={t.assignee.name} className="w-6 h-6" />
                <button
                  onClick={() => remove.mutate(t.id)}
                  className="text-foreground/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Task"
        footer={
          <Button
            className="w-full"
            disabled={create.isPending || !form.title.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create task"}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {(meta?.taskPriorities ?? ["LOW", "MEDIUM", "HIGH"]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p]?.label ?? p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Related account">
            <Select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              <option value="">None</option>
              {(meta?.accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          {meta?.isManager && (
            <Field label="Assign to">
              <Select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
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
        </div>
      </Drawer>
    </div>
  );
}
