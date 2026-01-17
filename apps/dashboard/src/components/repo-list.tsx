"use client";

import type { Repo } from "@ralph/core";

interface RepoListProps {
  repos: Repo[];
}

export function RepoList({ repos }: RepoListProps) {
  if (repos.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-gray-500">No repositories configured</p>
        <a
          href="/repos/new"
          className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
        >
          Add your first repository
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <div
          key={repo.id}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{repo.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  repo.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {repo.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 font-mono">{repo.slug}</p>
            <p className="mt-2 text-sm text-gray-600">
              {repo.description || "No description"}
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Git:</span>{" "}
                <code className="bg-gray-100 px-1 rounded">{repo.gitUrl}</code>
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Branch:</span> {repo.branch}
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Image:</span>{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {repo.dockerImage}
                </code>
              </div>
              {repo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {repo.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <a
              href={`/repos/${repo.slug}`}
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Edit repository &rarr;
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
