import { ApplicationForm } from "@/components/ApplicationForm";
import { PageHeader } from "@/components/PageHeader";
import { listResumes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function NewApplicationPage() {
  const resumes = listResumes();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add application"
        description="Capture the posting, where you are in the process, and the resume you sent (or plan to send)."
      />
      <ApplicationForm mode="create" resumes={resumes} />
    </div>
  );
}
