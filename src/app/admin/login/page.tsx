import { redirect } from "next/navigation";
import { adminEnabled, isAdmin } from "@/lib/server/adminAuth";
import { LoginForm } from "@/components/crm/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">§ Seitz Rechtsschutz</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy">CRM-Login</h1>
        {adminEnabled() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
            Der Login ist noch nicht eingerichtet. Setze auf dem Server <code className="font-mono">ADMIN_PASSWORD</code> (mindestens 12 Zeichen) und starte die Seite neu.
          </p>
        )}
      </div>
    </div>
  );
}
