import { getJobById, getJobLogs, getRepoById } from "@ralph/db";
import { notFound } from "next/navigation";
import { JobDetails } from "@/components/job-details";
import { JobLogs } from "@/components/job-logs";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  const repo = await getRepoById(job.repoId);
  const logs = await getJobLogs(job.id);

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <a
          href="/"
          className="text-sm text-purple-600 hover:text-purple-500"
        >
          &larr; Back to Jobs
        </a>
      </div>
      <JobDetails job={job} repo={repo} />
      <JobLogs logs={logs} jobStatus={job.status} jobId={job.id} />
    </div>
  );
}
