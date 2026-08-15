import { getIntegrityStatus } from "@/db/client";
import { getStatusCounts, listApplications } from "@/db/queries";
import { Sidebar } from "./Sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const counts = getStatusCounts();
  const total = listApplications().length;
  const integrity = getIntegrityStatus();

  return (
    <div className="flex min-h-full">
      <Sidebar
        counts={counts}
        total={total}
        integrityOk={integrity.ok}
        integrityMessage={integrity.message}
      />
      <div className="min-w-0 flex-1">
        {!integrity.ok ? (
          <div className="border-b border-red-200 bg-red-50 px-8 py-3 text-sm text-red-800">
            Database integrity check failed. Restore a file from{" "}
            <code className="rounded bg-white px-1">data/backups/</code>. Writes
            are blocked until the database is healthy.
          </div>
        ) : null}
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
