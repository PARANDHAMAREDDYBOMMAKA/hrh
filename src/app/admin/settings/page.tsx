"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Sunrise, Moon, ChevronDown } from "lucide-react";

interface TimeSlot {
  id: string;
  name: string;
  slotType: "BREAKFAST" | "DINNER";
  orderCutoffTime: string;
  deliveryTime: string;
  isActive: boolean;
}

type Draft = Record<string, { orderCutoffTime?: string; deliveryTime?: string }>;

const slotMeta: Record<string, { label: string; icon: typeof Sunrise; iconBg: string }> = {
  BREAKFAST: { label: "Breakfast", icon: Sunrise, iconBg: "bg-amber-500" },
  DINNER: { label: "Dinner", icon: Moon, iconBg: "bg-indigo-500" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = (value || "00:00").split(":");
  const minutes = MINUTE_STEPS.includes(m) ? MINUTE_STEPS : [...MINUTE_STEPS, m].sort();
  const selectClass =
    "appearance-none w-full pl-3.5 pr-9 py-3 rounded-xl bg-accent/40 border-0 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 cursor-pointer";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={selectClass}>
          {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 text-foreground/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      <span className="text-foreground/30 font-bold">:</span>
      <div className="relative flex-1">
        <select value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={selectClass}>
          {minutes.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 text-foreground/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

export default function TimingsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>({});

  const { data: slots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ["timeslots"],
    queryFn: () => fetch("/api/admin/timeslots").then((r) => r.json()),
  });

  const save = useMutation({
    mutationFn: (slot: TimeSlot) =>
      fetch("/api/admin/timeslots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotType: slot.slotType,
          orderCutoffTime: draft[slot.slotType]?.orderCutoffTime ?? slot.orderCutoffTime,
          deliveryTime: draft[slot.slotType]?.deliveryTime ?? slot.deliveryTime,
        }),
      }).then((r) => { if (!r.ok) throw r; return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      toast.success("Timings updated");
    },
    onError: () => toast.error("Failed to update timings"),
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Timings</h2>
        <p className="text-foreground/35 text-sm mt-1">
          Set the order cutoff and delivery time for each slot. These apply to every partner menu.
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-56 rounded-3xl bg-white animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {slots.map((slot) => {
            const meta = slotMeta[slot.slotType];
            const Icon = meta?.icon || Clock;
            const cutoff = draft[slot.slotType]?.orderCutoffTime ?? slot.orderCutoffTime;
            const delivery = draft[slot.slotType]?.deliveryTime ?? slot.deliveryTime;
            return (
              <div key={slot.id} className="rounded-3xl bg-white shadow-soft p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${meta?.iconBg || "bg-foreground"} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold tracking-tight">{meta?.label || slot.name}</h3>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground/50 mb-2">Order Cutoff</label>
                    <TimeField
                      value={cutoff}
                      onChange={(v) => setDraft((p) => ({ ...p, [slot.slotType]: { ...p[slot.slotType], orderCutoffTime: v } }))}
                    />
                    <p className="text-[11px] text-foreground/30 mt-1.5">Orders close at this time.</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground/50 mb-2">Delivery Time</label>
                    <TimeField
                      value={delivery}
                      onChange={(v) => setDraft((p) => ({ ...p, [slot.slotType]: { ...p[slot.slotType], deliveryTime: v } }))}
                    />
                    <p className="text-[11px] text-foreground/30 mt-1.5">Meals are delivered by this time.</p>
                  </div>
                </div>

                <button
                  onClick={() => save.mutate(slot)}
                  disabled={save.isPending || !cutoff || !delivery}
                  className="mt-5 w-full py-3 rounded-xl bg-foreground text-background text-sm font-semibold btn-smooth hover:opacity-80 disabled:opacity-50"
                >
                  {save.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
