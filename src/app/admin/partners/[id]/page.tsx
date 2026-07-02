"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Trash2, ToggleLeft, ToggleRight, ShoppingBag } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PartnerQR } from "@/components/partner-qr";

interface Partner {
  id: string;
  name: string;
  address: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  commissionRate: number;
  isActive: boolean;
  totalRooms: number;
  _count: { orders: number };
}

const fields = [
  { key: "name", label: "Hostel/Hotel Name" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
] as const;

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: partner, isLoading } = useQuery<Partner>({
    queryKey: ["partner", id],
    queryFn: () => fetch(`/api/admin/partners/${id}`).then((r) => r.json()),
  });

  const current = form ?? partner;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["partner", id] });
    queryClient.invalidateQueries({ queryKey: ["partners"] });
  };

  const save = useMutation({
    mutationFn: (data: Partner) =>
      fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => { if (!r.ok) throw r; return r.json(); }),
    onSuccess: () => { invalidate(); setForm(null); toast.success("Partner updated"); },
    onError: () => toast.error("Failed to update partner"),
  });

  const toggle = useMutation({
    mutationFn: (isActive: boolean) =>
      fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => { invalidate(); toast.success("Status updated"); },
  });

  const remove = useMutation({
    mutationFn: () => fetch(`/api/admin/partners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner deleted");
      router.push("/admin/partners");
    },
  });

  const inputClass =
    "w-full px-4 py-3 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-sm";

  if (isLoading || !current) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white animate-pulse" />
        <div className="h-96 rounded-3xl bg-white animate-pulse" />
      </div>
    );
  }

  const setField = (key: string, value: string) =>
    setForm({ ...(current as Partner), [key]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/admin/partners" className="flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Partners
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggle.mutate(!current.isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              current.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}
          >
            {current.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {current.isActive ? "Active" : "Inactive"}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{partner?.name}</h2>
        <span className="flex items-center gap-1.5 text-[13px] text-foreground/40">
          <ShoppingBag className="w-3.5 h-3.5" />
          {current._count?.orders ?? 0} orders
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 order-first">
          <PartnerQR partnerId={id} partnerName={partner?.name || "Partner"} variant="card" />
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-white shadow-soft p-6">
          <h3 className="text-base font-bold tracking-tight mb-5">Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => {
              const locked = f.key === "email";
              return (
                <div key={f.key} className={f.key === "address" ? "sm:col-span-2" : ""}>
                  <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                    {f.label}
                    {locked && <span className="text-foreground/30 font-normal"> · used for login, can&apos;t be changed</span>}
                  </label>
                  <input
                    value={(current[f.key] as string) ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    disabled={locked}
                    className={`${inputClass} ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>
              );
            })}
            <div>
              <label className="block text-[13px] font-medium text-foreground/50 mb-2">Commission %</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={current.commissionRate}
                onChange={(e) => setField("commissionRate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground/50 mb-2">Total Rooms</label>
              <input
                type="number" min="0"
                value={current.totalRooms}
                onChange={(e) => setField("totalRooms", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <button
            onClick={() => save.mutate(current as Partner)}
            disabled={save.isPending || !form}
            className="mt-6 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold btn-smooth hover:opacity-80 disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : form ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Partner"
        message="Are you sure you want to delete this partner? This will also remove their login access and cannot be undone."
        confirmLabel="Delete Partner"
        onConfirm={() => { remove.mutate(); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
