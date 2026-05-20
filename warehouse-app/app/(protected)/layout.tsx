import { LayoutShell } from "@/components/layout/LayoutShell";
import { getSession } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <LayoutShell userName={session.user.name ?? ""} userRole={session.user.role as string}>
      {children}
    </LayoutShell>
  );
}
