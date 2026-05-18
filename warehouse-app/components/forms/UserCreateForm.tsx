"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      role: fd.get("role"),
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(typeof err.error === "string" ? err.error : "Ошибка создания");
      return;
    }

    router.push("/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
        <input name="name" required className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input name="email" type="email" required className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль * (минимум 6 символов)</label>
        <input name="password" type="password" required minLength={6} className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
        <select name="role" required className={inp}>
          <option value="STOREKEEPER">Кладовщик</option>
          <option value="MANAGER">Менеджер</option>
          <option value="ADMIN">Администратор</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Создание..." : "Создать пользователя"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Отмена
        </button>
      </div>
    </form>
  );
}

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
