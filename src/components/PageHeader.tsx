import Link from "next/link";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight break-words text-foreground md:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 hidden text-sm text-muted break-words lg:block">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="hidden items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover lg:inline-flex"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
