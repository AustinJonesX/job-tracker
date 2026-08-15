import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Not found</h1>
      <p className="mt-2 text-sm text-muted">
        That page or application does not exist. It may have been removed from
        the tracker.
      </p>
      <Link
        href="/applications"
        className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to applications
      </Link>
    </div>
  );
}
