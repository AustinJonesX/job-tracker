import { PageHeader } from "@/components/PageHeader";
import { ResumeLibrary } from "@/components/ResumeLibrary";
import { listResumes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function ResumesPage() {
  const resumes = listResumes();

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="A library of files you have used. Identical uploads are stored once and can be reused on multiple applications."
      />
      <ResumeLibrary resumes={resumes} />
    </div>
  );
}
