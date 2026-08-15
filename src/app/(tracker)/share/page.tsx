import { PageHeader } from "@/components/PageHeader";
import { SharePanel } from "@/components/SharePanel";
import { shareStatus } from "@/lib/share-runtime";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const status = await shareStatus();

  return (
    <div className="mx-auto min-w-0 max-w-3xl">
      <PageHeader
        title="Remote access"
        description="Optional password-protected access from outside your network. The app stays on this computer."
      />
      <SharePanel initialStatus={status} />
    </div>
  );
}
