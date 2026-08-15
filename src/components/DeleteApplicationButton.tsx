"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteApplicationButton({
  id,
  company,
}: {
  id: number;
  company: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        `Remove the ${company} application from your tracker? This hides it from the list (it is not erased from disk).`,
      )
    ) {
      return;
    }
    setPending(true);
    const response = await fetch(`/api/applications/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/applications");
      router.refresh();
    } else {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}
