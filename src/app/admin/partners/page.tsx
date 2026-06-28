"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Building2, QrCode, ToggleLeft, ToggleRight, Trash2, X, Download, Copy, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

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
  const [showQR, setShowQR] = useState<Partner | null>(null);
  const [copied, setCopied] = useState(false);
  const [newPartnerCreds, setNewPartnerCreds] = useState<{ email: string; password: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", contactPerson: "", phone: "", email: "", commissionRate: "10", totalRooms: "0" });

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["partners"],
    queryFn: () => fetch("/api/admin/partners").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, commissionRate: parseFloat(data.commissionRate), totalRooms: parseInt(data.totalRooms) }),
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
      setForm({ name: "", address: "", city: "", contactPerson: "", phone: "", email: "", commissionRate: "10", totalRooms: "0" });
      if (data.credentials) {
        setNewPartnerCreds(data.credentials);
      }
      toast.success("Partner added with login access");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/partners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner deleted");
    },
  });

  const menuUrl = (id: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/menu/${id}`;

  function downloadQR() {
    if (!showQR || !qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current.querySelector("canvas");
    if (!canvas) return;

    const padding = 40;
    const labelHeight = 60;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + padding * 2;
    finalCanvas.height = canvas.height + padding * 2 + labelHeight;
    const ctx = finalCanvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(showQR.name, finalCanvas.width / 2, canvas.height + padding + 30);

    ctx.fillStyle = "#f97316";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Scan to order food", finalCanvas.width / 2, canvas.height + padding + 55);

    const link = document.createElement("a");
    link.download = `QR-${showQR.name.replace(/\s+/g, "-")}.png`;
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
    toast.success("QR downloaded");
  }

  function copyLink() {
    if (!showQR) return;
    navigator.clipboard.writeText(menuUrl(showQR.id));
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.commissionRate}
                    onChange={(e) => setForm((p) => ({ ...p, commissionRate: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">Total Rooms</label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalRooms}
                    onChange={(e) => setForm((p) => ({ ...p, totalRooms: e.target.value }))}
                    placeholder="e.g. 20"
                    className="w-full px-4 py-3 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm"
                  />
                </div>
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
                  navigator.clipboard.writeText(`Email: ${newPartnerCreds.email}\nPassword: ${newPartnerCreds.password}`);
                  toast.success("Credentials copied");
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
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

      {showQR && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border p-8 text-center max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-1">{showQR.name}</h3>
            <p className="text-sm text-muted-foreground mb-6">Scan to view menu & order food</p>

            <div className="bg-white p-6 rounded-xl border border-border inline-block mb-4">
              <QRCodeSVG value={menuUrl(showQR.id)} size={200} />
            </div>

            <div ref={qrCanvasRef} className="hidden">
              <QRCodeCanvas value={menuUrl(showQR.id)} size={300} />
            </div>

            <p className="text-xs text-muted-foreground break-all mb-6 px-4">{menuUrl(showQR.id)}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={downloadQR}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs font-medium">Download</span>
              </button>
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span className="text-xs font-medium">{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            <button onClick={() => { setShowQR(null); setCopied(false); }} className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
              Close
            </button>
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
            <div key={partner.id} className="p-5 rounded-2xl bg-white border border-border hover:border-orange-200 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-4">
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
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowQR(partner)} className="p-2 rounded-lg hover:bg-orange-50 transition-colors" title="QR Code">
                    <QrCode className="w-4 h-4 text-orange-500" />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: partner.id, isActive: !partner.isActive })}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    title="Toggle Status"
                  >
                    {partner.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(partner.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Partner"
        message="Are you sure you want to delete this partner? This will also remove their login access. This action cannot be undone."
        confirmLabel="Delete Partner"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
