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

interface Category { id: string; name: string; description: string | null; productsCount: number; }

interface Props { initial: Category[]; }

export function CategoriesClient({ initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Category[]>(initial);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q));
  }, [items, search]);

  async function handleSave(form: { name: string; description: string }) {
    setSubmitLoading(true);
    try {
      const isEdit = !!editing;
      const url = isEdit ? `/api/categories/${editing!.id}` : "/api/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t.errors.generic);
        return;
      }
      toast.success(isEdit ? t.common.save : t.categories.created);
      setEditing(null);
      setCreating(false);
      router.refresh();
      // optimistic update of local list
      const saved = await res.json();
      setItems((prev) => isEdit ? prev.map((c) => c.id === saved.id ? { ...c, ...saved, productsCount: c.productsCount } : c) : [...prev, { ...saved, productsCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      toast.error(t.errors.network);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t.errors.generic);
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: Column<Category>[] = [
    {
      key: "name", header: t.categories.fields.name, mobilePrimary: true,
      cell: (c) => <span className="font-medium text-gray-900">{c.name}</span>,
    },
    {
      key: "description", header: t.categories.fields.description,
      cell: (c) => <span className="text-gray-600">{c.description || "—"}</span>,
    },
    {
      key: "count", header: t.categories.productsCount, align: "right",
      cell: (c) => <span className="font-medium tabular-nums">{c.productsCount}</span>,
    },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setEditing(c)} className="p-1.5 text-gray-400 hover:text-brand-600" aria-label={t.common.edit}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleting(c)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={t.common.delete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.categories.title}
        description={t.categories.subtitle}
        backHref={undefined}
      >
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> {t.categories.create}
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(c) => c.id}
        onRowClick={(c) => setEditing(c)}
        empty={<EmptyState title={t.categories.empty} description={search ? t.common.noData : undefined} />}
      />

      <CategoryFormSheet
        open={creating || editing !== null}
        category={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={handleSave}
        loading={submitLoading}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`${t.common.delete}: ${deleting?.name ?? ""}`}
        description={t.common.required}
        destructive
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CategoryFormSheet({
  open, category, onClose, onSubmit, loading,
}: {
  open: boolean; category: Category | null; onClose: () => void;
  onSubmit: (form: { name: string; description: string }) => void; loading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setShowErrors(false);
    }
  }, [open, category]);

  const nameError = showErrors && !name.trim() ? t.validation.required : "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setShowErrors(true); return; }
    onSubmit({ name: name.trim(), description: description.trim() });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category ? `${t.common.edit}: ${category.name}` : t.categories.create}
      side="right"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            {category ? t.common.save : t.common.create}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t.categories.fields.name} required error={nameError}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={!!nameError} />
        </FormField>
        <FormField label={t.categories.fields.description}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </FormField>
      </form>
    </Sheet>
  );
}
