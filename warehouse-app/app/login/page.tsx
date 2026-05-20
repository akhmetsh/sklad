import { LoginForm } from "@/components/forms/LoginForm";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.app.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.auth.login.subtitle}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
