"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Warehouse { id: string; name: string; address: string | null; description: string | null; locationsCount: number; }

export function WarehousesClient({ initial }: { initial: Warehouse[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Warehouse[]>(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((w) => w.name.toLowerCase().includes(q) || (w.address ?? "").toLowerCase().includes(q));
  }, [items, search]);

  async function handleSave(form: { name: string; address: string; description: string }) {
    setSubmitLoading(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/warehouses/${editing!.id}` : "/api/warehouses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      const saved = await res.json();
      toast.success(isEdit ? t.common.save : t.warehouses.created);
      setEditing(null); setCreating(false);
      setItems((prev) => isEdit
        ? prev.map((w) => w.id === saved.id ? { ...w, ...saved, locationsCount: w.locationsCount } : w)
        : [...prev, { ...saved, locationsCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setSubmitLoading(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/warehouses/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      setItems((prev) => prev.filter((w) => w.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setDeleteLoading(false); }
  }

  const columns: Column<Warehouse>[] = [
    { key: "name", header: t.warehouses.fields.name, mobilePrimary: true, cell: (w) => <span className="font-medium">{w.name}</span> },
    { key: "address", header: t.warehouses.fields.address, cell: (w) => <span className="text-gray-600">{w.address || "—"}</span> },
    { key: "count", header: t.warehouses.locationsCount, align: "right", cell: (w) => <span className="tabular-nums">{w.locationsCount}</span> },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (w) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(w)} className="p-1.5 text-gray-400 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleting(w)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.warehouses.title} description={t.warehouses.subtitle}>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> {t.warehouses.create}</Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(w) => w.id}
        onRowClick={(w) => setEditing(w)}
        empty={<EmptyState title={t.warehouses.empty} />}
      />

      <WarehouseFormSheet
        open={creating || editing !== null}
        warehouse={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={handleSave}
        loading={submitLoading}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`${t.common.delete}: ${deleting?.name ?? ""}`}
        destructive
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function WarehouseFormSheet({
  open, warehouse, onClose, onSubmit, loading,
}: {
  open: boolean; warehouse: Warehouse | null; onClose: () => void;
  onSubmit: (form: { name: string; address: string; description: string }) => void; loading: boolean;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setName(warehouse?.name ?? "");
      setAddress(warehouse?.address ?? "");
      setDescription(warehouse?.description ?? "");
      setShowErrors(false);
    }
  }, [open, warehouse]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setShowErrors(true); return; }
    onSubmit({ name: name.trim(), address: address.trim(), description: description.trim() });
  }

  return (
    <Sheet
      open={open} onClose={onClose}
      title={warehouse ? `${t.common.edit}: ${warehouse.name}` : t.warehouses.create}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>{warehouse ? t.common.save : t.common.create}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t.warehouses.fields.name} required error={showErrors && !name.trim() ? t.validation.required : ""}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={showErrors && !name.trim()} />
        </FormField>
        <FormField label={t.warehouses.fields.address}>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField label={t.common.description}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormField>
      </form>
    </Sheet>
  );
}
