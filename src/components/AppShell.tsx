import Link from "next/link";
import { getIntegrityStatus } from "@/db/client";
import { getStatusCounts, listApplications } from "@/db/queries";
import { BrandLink } from "./nav";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const counts = getStatusCounts();
  const total = listApplications().length;
  const integrity = getIntegrityStatus();

  return (
    <div className="flex min-h-full max-w-full bg-background">
      <Sidebar
        counts={counts}
        total={total}
        integrityOk={integrity.ok}
        integrityMessage={integrity.message}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur lg:hidden"
          style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
        >
          <BrandLink compact />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <Link
              href="/applications/new"
              className="rounded-lg bg-accent px-2.5 py-1.5 text-sm font-medium text-accent-fg"
            >
              Add
            </Link>
          </div>
        </header>
        {!integrity.ok ? (
          <div className="border-b border-danger bg-danger-subtle px-3 py-3 text-sm text-danger lg:px-8">
            Database integrity check failed. Restore a file from{" "}
            <code className="break-all rounded bg-card px-1">data/backups/</code>
            . Writes are blocked until the database is healthy.
          </div>
        ) : null}
        <main className="min-w-0 px-3 py-4 pb-24 sm:px-4 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
