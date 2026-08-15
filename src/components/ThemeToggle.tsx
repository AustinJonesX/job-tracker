"use client";

import { useSyncExternalStore } from "react";
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: ThemePreference) {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const current = readTheme();
    if (current === "system") applyTheme("system");
    emit();
  };
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
  };
}

function readTheme(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

function choose(next: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
  emit();
}

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "system", label: "System", icon: "system" },
  { value: "dark", label: "Dark", icon: "moon" },
];

function ThemeIcon({ name }: { name: string }) {
  const className = "h-3.5 w-3.5";
  if (name === "sun") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  return (
    <div className="shrink-0 rounded-lg border border-border bg-subtle p-0.5">
      <div className="grid grid-cols-3 gap-0.5" role="radiogroup" aria-label="Color theme">
        {OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              title={option.label}
              onClick={() => choose(option.value)}
              className={`flex items-center justify-center rounded-md px-1.5 py-1.5 ${
                selected
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <ThemeIcon name={option.icon} />
              <span className="sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
