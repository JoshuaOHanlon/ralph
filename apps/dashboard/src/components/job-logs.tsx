"use client";

import { useEffect, useRef, useState } from "react";
import type { JobLog, JobStatus } from "@ralphberry/core";

interface JobLogsProps {
  logs: JobLog[];
  jobStatus: JobStatus;
  jobId: string;
}

export function JobLogs({ logs: initialLogs, jobStatus, jobId }: JobLogsProps) {
  const [logs, setLogs] = useState(initialLogs);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Poll for new logs when job is running
  useEffect(() => {
    if (jobStatus !== "running") return;

    const interval = setInterval(async () => {
      const lastId = logs[logs.length - 1]?.id ?? 0;
      const response = await fetch(`/api/jobs/${jobId}/logs?afterId=${lastId}`);
      const newLogs = (await response.json()) as JobLog[];

      if (newLogs.length > 0) {
        setLogs((prev) => [...prev, ...newLogs]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobStatus, jobId, logs]);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Logs</h3>
          <p className="mt-2 text-sm text-gray-500">No logs yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Logs
          {jobStatus === "running" && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Live
            </span>
          )}
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <div className="bg-gray-900 text-gray-100 p-4 font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`whitespace-pre-wrap ${
                log.stream === "stderr" ? "text-red-400" : ""
              }`}
            >
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              {log.content}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
