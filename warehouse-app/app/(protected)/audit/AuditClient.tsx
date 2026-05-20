"use client";

import { useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/StatusBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";
import { downloadCSV, toCSV } from "@/lib/csv";
import { t } from "@/lib/i18n";

interface LogEntry {
  id: string; createdAt: string; userName: string;
  action: string; entityType: string; entityId: string;
}

const actionTone: Record<string, "green" | "blue" | "red" | "gray" | "orange"> = {
  CREATE: "blue",
  UPDATE: "gray",
  CONFIRM: "green",
  DELETE: "red",
  CANCEL: "orange",
};

export function AuditClient({ initial }: { initial: LogEntry[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const allActions = useMemo(() => Array.from(new Set(initial.map((l) => l.action))).sort(), [initial]);
  const allEntities = useMemo(() => Array.from(new Set(initial.map((l) => l.entityType))).sort(), [initial]);

  const filtered = useMemo(() => {
    let result = initial;
    if (actionFilter) result = result.filter((l) => l.action === actionFilter);
    if (entityFilter) result = result.filter((l) => l.entityType === entityFilter);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((l) =>
      l.userName.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q));
    return result;
  }, [initial, search, actionFilter, entityFilter]);

  function actionLabel(a: string): string {
    return (t.audit.actions as Record<string, string>)[a] ?? a;
  }

  function entityLabel(e: string): string {
    return (t.audit.entities as Record<string, string>)[e] ?? e;
  }

  const columns: Column<LogEntry>[] = [
    {
      key: "date", header: t.audit.columns.date,
      cell: (l) => <span className="text-gray-500 text-xs whitespace-nowrap font-mono">{formatDateTime(l.createdAt)}</span>,
    },
    {
      key: "user", header: t.audit.columns.user, mobilePrimary: true,
      cell: (l) => <span className="font-medium text-gray-900">{l.userName}</span>,
    },
    {
      key: "action", header: t.audit.columns.action,
      cell: (l) => <Badge tone={actionTone[l.action] ?? "gray"}>{actionLabel(l.action)}</Badge>,
    },
    {
      key: "entity", header: t.audit.columns.entity,
      cell: (l) => <span className="text-gray-600">{entityLabel(l.entityType)}</span>,
    },
    {
      key: "id", header: "ID", hideOnMobile: true,
      cell: (l) => <span className="font-mono text-xs text-gray-400">{l.entityId.slice(0, 12)}…</span>,
    },
  ];

  function handleExport() {
    const headers = [
      t.audit.columns.date, t.audit.columns.user, t.audit.columns.action,
      t.audit.columns.entity, "ID",
    ];
    const rows = filtered.map((l) => [
      formatDateTime(l.createdAt), l.userName, actionLabel(l.action), entityLabel(l.entityType), l.entityId,
    ]);
    downloadCSV(`audit-${new Date().toISOString().split("T")[0]}.csv`, toCSV(headers, rows));
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.audit.title} description={t.audit.subtitle}>
        <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="w-4 h-4" /> CSV
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
        </div>
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="sm:w-44">
          <option value="">{t.audit.columns.action}: {t.common.all}</option>
          {allActions.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}
        </Select>
        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="sm:w-52">
          <option value="">{t.audit.columns.entity}: {t.common.all}</option>
          {allEntities.map((e) => <option key={e} value={e}>{entityLabel(e)}</option>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(l) => l.id}
        empty={<EmptyState title={t.audit.empty} />}
      />
    </div>
  );
}
