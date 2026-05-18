"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "textarea";
  required?: boolean;
}

interface Props {
  title: string;
  endpoint: string;
  fields: Field[];
  onSuccess?: () => void;
}

export function InlineCreateForm({ title, endpoint, fields, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fields.forEach((f) => {
      const val = fd.get(f.name) as string;
      if (val) body[f.name] = val;
    });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Ошибка сохранения");
      return;
    }

    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
      >
        + {title}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 max-w-lg">
          <p className="text-sm font-medium text-blue-900">{title}</p>
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {f.label}{f.required && " *"}
              </label>
              {f.type === "textarea" ? (
                <textarea name={f.name} rows={2} required={f.required} className={inp} />
              ) : (
                <input name={f.name} type={f.type ?? "text"} required={f.required} className={inp} />
              )}
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Сохранение..." : "Создать"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
