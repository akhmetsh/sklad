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

interface Supplier {
  id: string; name: string;
  contactPerson: string | null; phone: string | null; email: string | null;
  address: string | null; description: string | null;
  receiptsCount: number;
}

export function SuppliersClient({ initial }: { initial: Supplier[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Supplier[]>(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q));
  }, [items, search]);

  type SupplierForm = { name: string; contactPerson: string; phone: string; email: string; address: string; description: string };

  async function handleSave(form: SupplierForm) {
    setSubmitLoading(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(isEdit ? `/api/suppliers/${editing!.id}` : "/api/suppliers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      const saved = await res.json();
      toast.success(isEdit ? t.common.save : t.suppliers.created);
      setEditing(null); setCreating(false);
      setItems((prev) => isEdit
        ? prev.map((s) => s.id === saved.id ? { ...s, ...saved, receiptsCount: s.receiptsCount } : s)
        : [...prev, { ...saved, receiptsCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setSubmitLoading(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      setItems((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setDeleteLoading(false); }
  }

  const columns: Column<Supplier>[] = [
    { key: "name", header: t.suppliers.fields.name, mobilePrimary: true, cell: (s) => <span className="font-medium">{s.name}</span> },
    { key: "contact", header: t.suppliers.fields.contactPerson, cell: (s) => <span className="text-gray-600">{s.contactPerson || "—"}</span> },
    { key: "phone", header: t.suppliers.fields.phone, cell: (s) => <span className="text-gray-600">{s.phone || "—"}</span>, hideOnMobile: false },
    { key: "email", header: t.suppliers.fields.email, cell: (s) => <span className="text-gray-600">{s.email || "—"}</span>, hideOnMobile: true },
    { key: "count", header: t.suppliers.receiptsCount, align: "right", cell: (s) => <span className="tabular-nums">{s.receiptsCount}</span>, hideOnMobile: true },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(s)} className="p-1.5 text-gray-400 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleting(s)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.suppliers.title} description={t.suppliers.subtitle}>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> {t.suppliers.create}</Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        onRowClick={(s) => setEditing(s)}
        empty={<EmptyState title={t.suppliers.empty} />}
      />

      <SupplierFormSheet
        open={creating || editing !== null}
        supplier={editing}
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

function SupplierFormSheet({
  open, supplier, onClose, onSubmit, loading,
}: {
  open: boolean; supplier: Supplier | null; onClose: () => void;
  onSubmit: (form: { name: string; contactPerson: string; phone: string; email: string; address: string; description: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setName(supplier?.name ?? "");
      setContactPerson(supplier?.contactPerson ?? "");
      setPhone(supplier?.phone ?? "");
      setEmail(supplier?.email ?? "");
      setAddress(supplier?.address ?? "");
      setDescription(supplier?.description ?? "");
      setShowErrors(false);
    }
  }, [open, supplier]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setShowErrors(true); return; }
    onSubmit({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      description: description.trim(),
    });
  }

  return (
    <Sheet
      open={open} onClose={onClose}
      title={supplier ? `${t.common.edit}: ${supplier.name}` : t.suppliers.create}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>{supplier ? t.common.save : t.common.create}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t.suppliers.fields.name} required error={showErrors && !name.trim() ? t.validation.required : ""}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={showErrors && !name.trim()} />
        </FormField>
        <FormField label={t.suppliers.fields.contactPerson}>
          <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t.suppliers.fields.phone}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 ..." inputMode="tel" />
          </FormField>
          <FormField label={t.suppliers.fields.email}>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </FormField>
        </div>
        <FormField label={t.suppliers.fields.address}>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField label={t.common.description}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormField>
      </form>
    </Sheet>
  );
}
