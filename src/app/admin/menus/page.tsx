"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Utensils, Trash2, X, Circle, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  slotType: string;
  imageUrl: string | null;
}

export default function MenusPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"BREAKFAST" | "DINNER">("BREAKFAST");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", isVeg: true, imageUrl: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", description: "", price: "", isVeg: true, imageUrl: "" });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", description: "", price: "", isVeg: true, imageUrl: "" });
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      isVeg: item.isVeg,
      imageUrl: item.imageUrl ?? "",
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("prefix", "menu");
      const r = await fetch("/api/upload", { method: "POST", body });
      if (!r.ok) throw r;
      const { url } = await r.json();
      setForm((p) => ({ ...p, imageUrl: url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["menu-items", activeTab],
    queryFn: async () => {
      const r = await fetch(`/api/admin/menus?slotType=${activeTab}`);
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const createItem = useMutation({
    mutationFn: (data: { name: string; description: string; price: string; isVeg: boolean; slotType: string; imageUrl: string }) =>
      fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => { if (!r.ok) throw r; return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      resetForm();
      toast.success("Item added");
    },
    onError: () => toast.error("Failed to add item"),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string; price: string; isVeg: boolean; imageUrl: string } }) =>
      fetch(`/api/admin/menus/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, description: data.description || null, imageUrl: data.imageUrl || null }),
      }).then((r) => { if (!r.ok) throw r; return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      resetForm();
      toast.success("Item updated");
    },
    onError: () => toast.error("Failed to update item"),
  });

  const toggleItem = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetch(`/api/admin/menus/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/menus/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Item deleted");
    },
  });

  const inputClass =
    "w-full px-4 py-3.5 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm";

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu</h2>
          <p className="text-foreground/35 text-sm mt-1">
            Manage your breakfast and dinner items
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium btn-smooth hover:opacity-80"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["BREAKFAST", "DINNER"] as const).map((slot) => (
          <button
            key={slot}
            onClick={() => setActiveTab(slot)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-500 ${
              activeTab === slot
                ? "bg-foreground text-background shadow-soft"
                : "bg-white text-foreground/40 hover:text-foreground shadow-soft hover:shadow-soft-md"
            }`}
          >
            {slot === "BREAKFAST" ? "Breakfast" : "Dinner"}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white shadow-soft">
          <Utensils className="w-12 h-12 mx-auto text-foreground/15 mb-4" />
          <p className="text-foreground/35 text-sm font-medium">
            No items in {activeTab.toLowerCase()} menu
          </p>
          <button
            onClick={openCreate}
            className="mt-5 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium btn-smooth hover:opacity-80"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-white shadow-soft overflow-hidden">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-6 hover:bg-accent/20 transition-colors duration-400 ${
                i < items.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                )}
                <Circle
                  className={`w-4 h-4 shrink-0 ${
                    item.isVeg ? "text-emerald-500" : "text-red-500"
                  }`}
                  fill="currentColor"
                />
                <div>
                  <div
                    className={`font-medium text-sm ${
                      !item.isAvailable
                        ? "line-through text-foreground/30"
                        : "text-foreground/80"
                    }`}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-foreground/30 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold tracking-tight">
                  ₹{item.price}
                </span>
                <button
                  onClick={() =>
                    toggleItem.mutate({
                      id: item.id,
                      isAvailable: !item.isAvailable,
                    })
                  }
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all duration-400 ${
                    item.isAvailable
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 rounded-lg text-foreground/20 hover:text-foreground hover:bg-accent/40 transition-all duration-400"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(item.id)}
                  className="p-2 rounded-lg text-foreground/20 hover:text-red-500 hover:bg-red-50 transition-all duration-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-soft-lg reveal-scale">
            <div className="p-6 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">
                {editId ? "Edit" : "Add"} {activeTab === "BREAKFAST" ? "Breakfast" : "Dinner"} Item
              </h3>
              <button
                onClick={resetForm}
                className="text-foreground/25 hover:text-foreground transition-colors duration-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editId) {
                  updateItem.mutate({
                    id: editId,
                    data: { name: form.name, description: form.description, price: form.price, isVeg: form.isVeg, imageUrl: form.imageUrl },
                  });
                } else {
                  createItem.mutate({ ...form, slotType: activeTab });
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                  Item Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="e.g., Masala Dosa"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                  Description (optional)
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g., Crispy dosa with potato filling"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                  Image (optional)
                </label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="block w-full text-[13px] text-foreground/50 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-medium file:bg-accent/40 file:text-foreground/70 hover:file:bg-accent/60 file:transition-colors disabled:opacity-50"
                  />
                </div>
                {uploading && (
                  <p className="text-[12px] text-foreground/35 mt-1.5">Uploading…</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                    placeholder="50"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground/50 mb-2">
                    Type
                  </label>
                  <select
                    value={form.isVeg ? "veg" : "nonveg"}
                    onChange={(e) => setForm((p) => ({ ...p, isVeg: e.target.value === "veg" }))}
                    className={inputClass}
                  >
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending || uploading}
                  className="w-full py-3.5 rounded-2xl bg-foreground text-background text-sm font-semibold btn-smooth hover:opacity-80 disabled:opacity-50"
                >
                  {editId
                    ? updateItem.isPending ? "Saving..." : "Save Changes"
                    : createItem.isPending ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmLabel="Delete Item"
        onConfirm={() => {
          if (deleteTarget) deleteItem.mutate(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
