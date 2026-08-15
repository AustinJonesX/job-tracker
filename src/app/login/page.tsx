import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { loadShareConfig } from "@/lib/share-config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (!loadShareConfig()?.enabled) {
    redirect("/");
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M3 12h18" />
            </svg>
          </span>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Job Tracker</h1>
            <p className="text-sm text-muted">Enter the access password</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
