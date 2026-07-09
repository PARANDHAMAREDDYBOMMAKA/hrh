"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { money, STAGE_LABEL, stageBadgeClass } from "@/lib/crm-ui";
import {
  Drawer,
  Field,
  Input,
  Button,
  Badge,
  Avatar,
  SectionCard,
  Spinner,
} from "@/components/crm/ui";
import { ActivityTimeline, type ActivityItem } from "@/components/crm/activity-timeline";

type Account = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  owner: { id: string; name: string };
  contacts: { id: string; firstName: string; lastName: string; title: string | null; email: string | null }[];
  opportunities: { id: string; name: string; stage: string; amount: number; owner: { name: string } }[];
  activities: ActivityItem[];
};

export default function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "", title: "" });

  const { data: account, isLoading } = useQuery<Account>({
    queryKey: ["crm", "account", id],
    queryFn: () => crmApi.get(`/api/crm/accounts/${id}`),
  });

  const addContact = useMutation({
    mutationFn: () => crmApi.post("/api/crm/contacts", { ...contact, accountId: id }),
    onSuccess: () => {
      toast.success("Contact added");
      qc.invalidateQueries({ queryKey: ["crm", "account", id] });
      setContactOpen(false);
      setContact({ firstName: "", lastName: "", email: "", phone: "", title: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => crmApi.del(`/api/crm/accounts/${id}`),
    onSuccess: () => {
      toast.success("Account deleted");
      router.push("/crm/accounts");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !account) return <Spinner />;

  return (
    <div className="space-y-5">
      <Link
        href="/crm/accounts"
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground/40 hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Accounts
      </Link>

      <div className="rounded-2xl bg-white border border-black/4 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">{account.name}</h2>
              <p className="text-[13px] text-foreground/40">
                {[account.industry, account.city].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[12px] text-foreground/50">
              <Avatar name={account.owner.name} className="w-6 h-6" />
              {account.owner.name}
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("Delete this account and its opportunities?")) remove.mutate();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-black/4 text-[13px]">
          <InfoRow icon={<Mail className="w-4 h-4" />} value={account.email} />
          <InfoRow icon={<Phone className="w-4 h-4" />} value={account.phone} />
          <InfoRow icon={<Globe className="w-4 h-4" />} value={account.website} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} value={account.address} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Contacts"
          action={
            <button
              onClick={() => setContactOpen(true)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-600"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          }
        >
          <div className="divide-y divide-black/4">
            {account.contacts.length === 0 ? (
              <p className="text-[13px] text-foreground/35 text-center py-8">No contacts yet.</p>
            ) : (
              account.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/crm/contacts?focus=${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.015]"
                >
                  <Avatar name={`${c.firstName} ${c.lastName}`} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-[11px] text-foreground/40 truncate">
                      {c.title || c.email || "—"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Opportunities">
          <div className="divide-y divide-black/4">
            {account.opportunities.length === 0 ? (
              <p className="text-[13px] text-foreground/35 text-center py-8">
                No opportunities yet.
              </p>
            ) : (
              account.opportunities.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-foreground/40" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-foreground truncate">
                        {o.name}
                      </div>
                      <Badge className={stageBadgeClass(o.stage)}>
                        {STAGE_LABEL[o.stage] ?? o.stage}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-foreground shrink-0">
                    {money(o.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity">
        <ActivityTimeline
          activities={account.activities}
          link={{ accountId: id }}
          invalidateKey={["crm", "account", id]}
        />
      </SectionCard>

      <Drawer
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add Contact"
        footer={
          <Button
            className="w-full"
            disabled={addContact.isPending || !contact.firstName.trim() || !contact.lastName.trim()}
            onClick={() => addContact.mutate()}
          >
            {addContact.isPending ? "Adding…" : "Add contact"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required>
              <Input
                value={contact.firstName}
                onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={contact.lastName}
                onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Title">
            <Input
              value={contact.title}
              onChange={(e) => setContact({ ...contact, title: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </Field>
        </div>
      </Drawer>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string | null }) {
  return (
    <div className="flex items-center gap-2 text-foreground/60">
      <span className="text-foreground/30">{icon}</span>
      <span className="truncate">{value || "—"}</span>
    </div>
  );
}
