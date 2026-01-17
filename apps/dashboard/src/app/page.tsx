import { getAllJobs } from "@ralph/db";
import { JobList } from "@/components/job-list";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await getAllJobs();

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            All Ralph jobs and their status
          </p>
        </div>
      </div>
      <JobList jobs={jobs} />
    </div>
  );
}
