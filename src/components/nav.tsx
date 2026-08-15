import Link from "next/link";

export const NAV = [
  { href: "/", label: "Home", icon: "grid" },
  { href: "/applications", label: "Jobs", icon: "list" },
  { href: "/resumes", label: "Resumes", icon: "file" },
  { href: "/share", label: "Share", icon: "share" },
] as const;

export type NavIconName = (typeof NAV)[number]["icon"];

export function NavIcon({ name }: { name: NavIconName }) {
  const className = "h-5 w-5";
  if (name === "grid") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M5 12h2M17 12h2M12 5v2M12 17v2" />
      <path d="M16.5 7.5 15 9M9 15l-1.5 1.5M16.5 16.5 15 15M9 9 7.5 7.5" />
    </svg>
  );
}

export function navItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrandMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M3 12h18" />
      </svg>
    </span>
  );
}

export function BrandLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2">
      <BrandMark />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          Job Tracker
        </span>
        {compact ? null : (
          <span className="mt-0.5 hidden text-xs text-muted lg:block">
            Local applications
          </span>
        )}
      </span>
    </Link>
  );
}
