"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Building2, Users, Target } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { useCrmMeta } from "@/hooks/use-crm-meta";
import {
  Drawer,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Avatar,
  EmptyState,
  Spinner,
} from "@/components/crm/ui";

type Account = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { contacts: number; opportunities: number };
};

const empty = {
  name: "",
  industry: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  ownerId: "",
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: meta } = useCrmMeta();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["crm", "accounts", q],
    queryFn: () => crmApi.get(`/api/crm/accounts?${q ? `q=${encodeURIComponent(q)}` : ""}`),
  });

  const create = useMutation({
    mutationFn: () =>
      crmApi.post("/api/crm/accounts", { ...form, ownerId: form.ownerId || undefined }),
    onSuccess: () => {
      toast.success("Account created");
      qc.invalidateQueries({ queryKey: ["crm", "accounts"] });
      qc.invalidateQueries({ queryKey: ["crm", "meta"] });
      setFormOpen(false);
      setForm({ ...empty });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Accounts</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">Companies you do business with</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          New Account
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25" />
        <Input
          placeholder="Search accounts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/4">
          <EmptyState
            icon={<Building2 className="w-10 h-10" />}
            title="No accounts yet"
            hint="Add a company or convert a qualified lead."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => router.push(`/crm/accounts/${a.id}`)}
              className="text-left rounded-2xl bg-white border border-black/4 p-5 hover:border-black/12 transition"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-500" />
                </div>
                <Avatar name={a.owner.name} className="w-6 h-6" />
              </div>
              <div className="mt-3 font-semibold text-foreground">{a.name}</div>
              <div className="text-[12px] text-foreground/40">
                {[a.industry, a.city].filter(Boolean).join(" · ") || "—"}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-black/4 text-[12px] text-foreground/50">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {a._count.contacts}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {a._count.opportunities}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Account"
        footer={
          <Button
            className="w-full"
            disabled={create.isPending || !form.name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create account"}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Website">
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
