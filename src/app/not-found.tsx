import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-foreground">Not found</h1>
      <p className="mt-2 text-sm text-muted">
        That page or application does not exist. It may have been removed from
        the tracker.
      </p>
      <Link
        href="/applications"
        className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        Back to applications
      </Link>
    </div>
  );
}
