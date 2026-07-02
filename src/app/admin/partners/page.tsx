"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Building2, X, Copy, Check, ChevronRight } from "lucide-react";

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
  credentials?: { email: string; password: string };
}

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newPartnerCreds, setNewPartnerCreds] = useState<{ email: string; password: string } | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", contactPerson: "", phone: "", email: "", commissionRate: "10" });

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["partners"],
    queryFn: () => fetch("/api/admin/partners").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, commissionRate: parseFloat(data.commissionRate) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setShowForm(false);
      setForm({ name: "", address: "", city: "", contactPerson: "", phone: "", email: "", commissionRate: "10" });
      if (data.credentials) {
        setNewPartnerCreds(data.credentials);
      }
      toast.success("Partner added with login access");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Partners</h2>
          <p className="text-foreground/35 text-sm mt-1">Manage your hotel and hostel partners</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium btn-smooth hover:opacity-80 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-soft-lg reveal-scale">
            <div className="p-6 border-b border-border/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Add Partner</h3>
                <p className="text-xs text-foreground/30 mt-1">A login account will be auto-created for them</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-foreground/25 hover:text-foreground transition-colors duration-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
              className="p-6 space-y-4"
            >
              {[
                { key: "name", label: "Hostel/Hotel Name", required: true },
                { key: "address", label: "Address", required: true },
                { key: "city", label: "City" },
                { key: "contactPerson", label: "Contact Person", required: true },
                { key: "phone", label: "Phone", required: true },
                { key: "email", label: "Email (will be used for partner login)", required: true },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">{field.label}</label>
                  <input
                    type={field.key === "email" ? "email" : field.key === "phone" ? "tel" : "text"}
                    inputMode={field.key === "phone" ? "numeric" : undefined}
                    maxLength={field.key === "phone" ? 15 : undefined}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (field.key === "phone") val = val.replace(/[^0-9+\-\s]/g, "");
                      setForm((p) => ({ ...p, [field.key]: val }));
                    }}
                    required={field.required}
                    className="w-full px-4 py-3 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">Commission %</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  value={form.commissionRate}
                  onChange={(e) => setForm((p) => ({ ...p, commissionRate: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-3 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm"
                />
                <p className="text-xs text-foreground/30 mt-1.5">The partner will set their room count when they first sign in.</p>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
              >
                {createMutation.isPending ? "Adding..." : "Add Partner & Create Login"}
              </button>
            </form>
          </div>
        </div>
      )}

      {newPartnerCreds && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold">Partner Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">Share these login credentials with the partner</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold">{newPartnerCreds.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono font-semibold">{newPartnerCreds.password}</span>
              </div>
            </div>
            <p className="text-xs text-red-500 text-center mb-4">Save these credentials now — the password won&apos;t be shown again</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newPartnerCreds.password);
                  toast.success("Password copied");
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Password
              </button>
              <button
                onClick={() => setNewPartnerCreds(null)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white border border-border animate-pulse" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border border-border">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No partners yet. Add your first hotel or hostel partner.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <Link
              key={partner.id}
              href={`/admin/partners/${partner.id}`}
              className="block p-5 rounded-2xl bg-white border border-border hover:border-orange-200 hover:shadow-soft transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold truncate">{partner.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${partner.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      {partner.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-words">{partner.address}{partner.city ? `, ${partner.city}` : ""}</p>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>{partner.contactPerson}</span>
                    <span>{partner.phone}</span>
                    <span>{partner.commissionRate}% commission</span>
                    <span>{partner._count.orders} orders</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/20 group-hover:text-foreground/50 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
