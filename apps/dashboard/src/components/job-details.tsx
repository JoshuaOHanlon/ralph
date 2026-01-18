"use client";

import type { Job, Repo } from "@ralphberry/core";

interface JobDetailsProps {
  job: Job;
  repo: Repo | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function JobDetails({ job, repo }: JobDetailsProps) {
  const completedStories = job.prd.userStories.filter((s) => s.passes).length;
  const totalStories = job.prd.userStories.length;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Job Details
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {job.prd.description}
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Job ID</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
              {job.id}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
              <span
                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[job.status]}`}
              >
                {job.status}
              </span>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Repository</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {repo?.name ?? "Unknown"} ({repo?.slug ?? "unknown"})
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Branch</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
              {job.prd.branchName}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Progress</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {completedStories}/{totalStories} stories completed (iteration{" "}
              {job.iteration}/{job.maxIterations})
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Triggered By</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {job.triggeredBy}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(job.createdAt).toLocaleString()}
            </dd>
          </div>
          {job.startedAt && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Started</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(job.startedAt).toLocaleString()}
              </dd>
            </div>
          )}
          {job.completedAt && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Completed</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(job.completedAt).toLocaleString()}
              </dd>
            </div>
          )}
          {job.errorMessage && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Error</dt>
              <dd className="mt-1 text-sm text-red-600 sm:mt-0 sm:col-span-2">
                {job.errorMessage}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* User Stories */}
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <h4 className="text-sm font-medium text-gray-500 mb-4">User Stories</h4>
        <div className="space-y-4">
          {job.prd.userStories.map((story) => (
            <div
              key={story.id}
              className={`p-4 rounded-lg ${
                story.passes ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {story.id}: {story.title}
                </span>
                <span
                  className={`text-xs ${
                    story.passes ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {story.passes ? "Complete" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{story.description}</p>
              <ul className="mt-2 space-y-1">
                {story.acceptanceCriteria.map((criteria, i) => (
                  <li key={i} className="text-xs text-gray-500">
                    • {criteria}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
