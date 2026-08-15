import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/ApplicationForm";
import { PageHeader } from "@/components/PageHeader";
import { getApplication, listResumes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const application = getApplication(id);
  if (!application) notFound();
  const resumes = listResumes();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${application.company}`}
        description={application.title}
      />
      <ApplicationForm
        mode="edit"
        application={application}
        resumes={resumes}
      />
    </div>
  );
}
