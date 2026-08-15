import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  SESSION_COOKIE,
  isValidSession,
  loadShareConfig,
} from "@/lib/share-config";

export const dynamic = "force-dynamic";

export default async function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = loadShareConfig();
  if (config?.enabled) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!isValidSession(token, config.sessionSecret)) {
      redirect("/login");
    }
  }

  return <AppShell>{children}</AppShell>;
}
