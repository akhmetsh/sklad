"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Unit { id: string; name: string; symbol: string; productsCount: number; }

export function UnitsClient({ initial }: { initial: Unit[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Unit[]>(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Unit | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q));
  }, [items, search]);

  async function handleSave(form: { name: string; symbol: string }) {
    setSubmitLoading(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/units/${editing!.id}` : "/api/units", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      const saved = await res.json();
      toast.success(isEdit ? t.common.save : t.units.created);
      setEditing(null); setCreating(false);
      setItems((prev) => isEdit
        ? prev.map((u) => u.id === saved.id ? { ...u, ...saved, productsCount: u.productsCount } : u)
        : [...prev, { ...saved, productsCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setSubmitLoading(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/units/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      setItems((prev) => prev.filter((u) => u.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setDeleteLoading(false); }
  }

  const columns: Column<Unit>[] = [
    { key: "name", header: t.units.fields.name, mobilePrimary: true, cell: (u) => <span className="font-medium">{u.name}</span> },
    { key: "symbol", header: t.units.fields.symbol, cell: (u) => <span className="font-mono text-gray-600">{u.symbol}</span> },
    { key: "count", header: t.categories.productsCount, align: "right", cell: (u) => <span className="tabular-nums">{u.productsCount}</span> },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(u)} className="p-1.5 text-gray-400 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleting(u)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.units.title} description={t.units.subtitle}>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> {t.units.create}</Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        onRowClick={(u) => setEditing(u)}
        empty={<EmptyState title={t.units.empty} />}
      />

      <UnitFormSheet
        open={creating || editing !== null}
        unit={editing}
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

function UnitFormSheet({
  open, unit, onClose, onSubmit, loading,
}: {
  open: boolean; unit: Unit | null; onClose: () => void;
  onSubmit: (form: { name: string; symbol: string }) => void; loading: boolean;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setName(unit?.name ?? "");
      setSymbol(unit?.symbol ?? "");
      setShowErrors(false);
    }
  }, [open, unit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !symbol.trim()) { setShowErrors(true); return; }
    onSubmit({ name: name.trim(), symbol: symbol.trim() });
  }

  return (
    <Sheet
      open={open} onClose={onClose}
      title={unit ? `${t.common.edit}: ${unit.name}` : t.units.create}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>{unit ? t.common.save : t.common.create}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t.units.fields.name} required hint={t.units.examples} error={showErrors && !name.trim() ? t.validation.required : ""}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={showErrors && !name.trim()} />
        </FormField>
        <FormField label={t.units.fields.symbol} required error={showErrors && !symbol.trim() ? t.validation.required : ""}>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} error={showErrors && !symbol.trim()} className="font-mono" />
        </FormField>
      </form>
    </Sheet>
  );
}
