"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Contact as ContactIcon, Mail, Phone } from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { useCrmMeta } from "@/hooks/use-crm-meta";
import {
  Drawer,
  Field,
  Input,
  Select,
  Button,
  Avatar,
  EmptyState,
  Spinner,
} from "@/components/crm/ui";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string };
};

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  accountId: "",
  ownerId: "",
};

export default function ContactsPage() {
  const qc = useQueryClient();
  const { data: meta } = useCrmMeta();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["crm", "contacts", q],
    queryFn: () => crmApi.get(`/api/crm/contacts?${q ? `q=${encodeURIComponent(q)}` : ""}`),
  });

  const create = useMutation({
    mutationFn: () =>
      crmApi.post("/api/crm/contacts", {
        ...form,
        accountId: form.accountId || undefined,
        ownerId: form.ownerId || undefined,
      }),
    onSuccess: () => {
      toast.success("Contact created");
      qc.invalidateQueries({ queryKey: ["crm", "contacts"] });
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
          <h2 className="text-xl font-bold text-foreground tracking-tight">Contacts</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">People at your accounts</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          New Contact
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25" />
        <Input
          placeholder="Search contacts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/5 shadow-soft">
          <EmptyState
            icon={<ContactIcon className="w-10 h-10" />}
            title="No contacts yet"
            hint="Add people you're working with, linked to their company."
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-black/5 shadow-soft overflow-hidden divide-y divide-black/4">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar name={`${c.firstName} ${c.lastName}`} className="w-9 h-9 text-[12px]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[14px] text-foreground">
                  {c.firstName} {c.lastName}
                </div>
                <div className="text-[12px] text-foreground/40">
                  {[c.title, c.account?.name].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[12px] text-foreground/50">
                {c.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-foreground/30" />
                    {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-foreground/30" />
                    {c.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Contact"
        footer={
          <Button
            className="w-full"
            disabled={create.isPending || !form.firstName.trim() || !form.lastName.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create contact"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Account">
            <Select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              <option value="">No account</option>
              {(meta?.accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
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
        </div>
      </Drawer>
    </div>
  );
}
