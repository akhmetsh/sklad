import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sklad</h1>
          <p className="mt-1 text-sm text-gray-500">Складская система учета</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
