"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Location { id: string; code: string; name: string; description: string | null; warehouseId: string; warehouseName: string; }
interface WarehouseOption { id: string; name: string; }

export function LocationsClient({ initial, warehouses }: { initial: Location[]; warehouses: WarehouseOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Location[]>(initial);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = items;
    if (warehouseFilter) result = result.filter((l) => l.warehouseId === warehouseFilter);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((l) => l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q));
    return result;
  }, [items, search, warehouseFilter]);

  async function handleSave(form: { warehouseId: string; code: string; name: string; description: string }) {
    setSubmitLoading(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/locations/${editing!.id}` : "/api/locations", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      const saved = await res.json();
      const wh = warehouses.find((w) => w.id === saved.warehouseId);
      toast.success(isEdit ? t.common.save : t.locations.created);
      setEditing(null); setCreating(false);
      setItems((prev) => isEdit
        ? prev.map((l) => l.id === saved.id ? { ...l, ...saved, warehouseName: wh?.name ?? l.warehouseName } : l)
        : [...prev, { ...saved, warehouseName: wh?.name ?? "" }].sort((a, b) =>
            a.warehouseName.localeCompare(b.warehouseName) || a.code.localeCompare(b.code)));
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setSubmitLoading(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/locations/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      setItems((prev) => prev.filter((l) => l.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setDeleteLoading(false); }
  }

  const columns: Column<Location>[] = [
    { key: "code", header: t.locations.fields.code, mobilePrimary: true, cell: (l) => <span className="font-mono font-medium">{l.code}</span> },
    { key: "name", header: t.locations.fields.name, cell: (l) => <span>{l.name}</span> },
    { key: "warehouse", header: t.locations.fields.warehouse, cell: (l) => <span className="text-gray-600">{l.warehouseName}</span> },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (l) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(l)} className="p-1.5 text-gray-400 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleting(l)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.locations.title} description={t.locations.subtitle}>
        <Button onClick={() => setCreating(true)} disabled={warehouses.length === 0}>
          <Plus className="w-4 h-4" /> {t.locations.create}
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
        </div>
        <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="sm:w-64">
          <option value="">{t.common.all}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(l) => l.id}
        onRowClick={(l) => setEditing(l)}
        empty={<EmptyState title={t.locations.empty} />}
      />

      <LocationFormSheet
        open={creating || editing !== null}
        location={editing}
        warehouses={warehouses}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={handleSave}
        loading={submitLoading}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`${t.common.delete}: ${deleting?.code ?? ""}`}
        destructive
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function LocationFormSheet({
  open, location, warehouses, onClose, onSubmit, loading,
}: {
  open: boolean; location: Location | null; warehouses: WarehouseOption[]; onClose: () => void;
  onSubmit: (form: { warehouseId: string; code: string; name: string; description: string }) => void; loading: boolean;
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setWarehouseId(location?.warehouseId ?? "");
      setCode(location?.code ?? "");
      setName(location?.name ?? "");
      setDescription(location?.description ?? "");
      setShowErrors(false);
    }
  }, [open, location]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId || !code.trim() || !name.trim()) { setShowErrors(true); return; }
    onSubmit({ warehouseId, code: code.trim(), name: name.trim(), description: description.trim() });
  }

  return (
    <Sheet
      open={open} onClose={onClose}
      title={location ? `${t.common.edit}: ${location.code}` : t.locations.create}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>{location ? t.common.save : t.common.create}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t.locations.fields.warehouse} required error={showErrors && !warehouseId ? t.validation.required : ""}>
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} error={showErrors && !warehouseId} autoFocus={!location}>
            <option value="">{t.common.select}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t.locations.fields.code} required error={showErrors && !code.trim() ? t.validation.required : ""}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} error={showErrors && !code.trim()} className="font-mono" placeholder="A-01" />
        </FormField>
        <FormField label={t.locations.fields.name} required error={showErrors && !name.trim() ? t.validation.required : ""}>
          <Input value={name} onChange={(e) => setName(e.target.value)} error={showErrors && !name.trim()} />
        </FormField>
      </form>
    </Sheet>
  );
}
