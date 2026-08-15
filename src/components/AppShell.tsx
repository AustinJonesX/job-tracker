import { getIntegrityStatus } from "@/db/client";
import { getStatusCounts, listApplications } from "@/db/queries";
import { Sidebar } from "./Sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const counts = getStatusCounts();
  const total = listApplications().length;
  const integrity = getIntegrityStatus();

  return (
    <div className="flex min-h-full bg-background">
      <Sidebar
        counts={counts}
        total={total}
        integrityOk={integrity.ok}
        integrityMessage={integrity.message}
      />
      <div className="min-w-0 flex-1">
        {!integrity.ok ? (
          <div className="border-b border-danger bg-danger-subtle px-8 py-3 text-sm text-danger">
            Database integrity check failed. Restore a file from{" "}
            <code className="rounded bg-card px-1">data/backups/</code>. Writes
            are blocked until the database is healthy.
          </div>
        ) : null}
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
