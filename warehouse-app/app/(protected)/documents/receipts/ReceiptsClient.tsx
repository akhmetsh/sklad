"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { downloadCSV, toCSV } from "@/lib/csv";
import { t } from "@/lib/i18n";

interface Receipt {
  id: string; documentNumber: string; date: string;
  supplierName: string; warehouseName: string;
  itemsCount: number; status: string; createdByName: string;
}

export function ReceiptsClient({ initial }: { initial: Receipt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let result = initial;
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (dateFrom) result = result.filter((r) => r.date.split("T")[0] >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date.split("T")[0] <= dateTo);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((r) =>
      r.documentNumber.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      r.warehouseName.toLowerCase().includes(q));
    return result;
  }, [initial, search, statusFilter, dateFrom, dateTo]);

  function handleExport() {
    const headers = [
      t.documents.common.number, t.documents.common.date,
      t.documents.receipts.fields.supplier, t.documents.common.warehouse,
      t.documents.common.itemsCount, t.common.status, t.audit.columns.user,
    ];
    const rows = filtered.map((r) => [
      r.documentNumber, formatDate(r.date), r.supplierName, r.warehouseName,
      r.itemsCount, r.status === "DRAFT" ? t.status.draft : r.status === "CONFIRMED" ? t.status.confirmed : t.status.cancelled,
      r.createdByName,
    ]);
    downloadCSV(`receipts-${new Date().toISOString().split("T")[0]}.csv`, toCSV(headers, rows));
  }

  const columns: Column<Receipt>[] = [
    {
      key: "number", header: t.documents.common.number, mobilePrimary: true,
      cell: (r) => (
        <Link href={`/documents/receipts/${r.id}`} className="font-mono text-sm font-medium text-brand-600 hover:underline">
          {r.documentNumber}
        </Link>
      ),
    },
    { key: "date", header: t.documents.common.date, cell: (r) => <span className="whitespace-nowrap">{formatDate(r.date)}</span> },
    { key: "supplier", header: t.documents.receipts.fields.supplier, cell: (r) => r.supplierName },
    { key: "warehouse", header: t.documents.common.warehouse, cell: (r) => <span className="text-gray-600">{r.warehouseName}</span>, hideOnMobile: true },
    { key: "items", header: t.documents.common.itemsCount, align: "right", cell: (r) => <span className="tabular-nums">{r.itemsCount}</span>, hideOnMobile: true },
    { key: "status", header: t.common.status, cell: (r) => <DocumentStatusBadge status={r.status} /> },
    { key: "author", header: t.audit.columns.user, cell: (r) => <span className="text-gray-500 text-xs">{r.createdByName}</span>, hideOnMobile: true },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.documents.receipts.title} description={t.documents.receipts.subtitle}>
        <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="w-4 h-4" /> CSV
        </Button>
        <Link href="/documents/receipts/new">
          <Button><Plus className="w-4 h-4" /> {t.documents.receipts.create}</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="">{t.common.all}</option>
          <option value="DRAFT">{t.status.draft}</option>
          <option value="CONFIRMED">{t.status.confirmed}</option>
          <option value="CANCELLED">{t.status.cancelled}</option>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="sm:w-44" aria-label={t.common.dateFrom} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="sm:w-44" aria-label={t.common.dateTo} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/documents/receipts/${r.id}`)}
        empty={<EmptyState
          title={t.common.noData}
          action={<Link href="/documents/receipts/new"><Button><Plus className="w-4 h-4" /> {t.documents.receipts.create}</Button></Link>}
        />}
      />
    </div>
  );
}
