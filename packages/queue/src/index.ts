import type { CreateJob, Job, JobStatus, Prd, CreateJobLog, JobLog } from "@ralphberry/core";
import {
  createJob,
  dequeueJob,
  getJobById,
  getJobsByStatus,
  getAllJobs,
  updateJobStatus,
  updateJobIteration,
  updateJobPrd,
  cancelJob,
  countPendingJobs,
  getRunningJob,
  addJobLog,
  getJobLogs,
  deleteJobLogs,
} from "@ralphberry/db";

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export class JobQueue {
  /**
   * Add a new job to the queue
   */
  async enqueue(data: CreateJob): Promise<Job> {
    return createJob(data);
  }

  /**
   * Atomically dequeue the next pending job
   * Returns null if no jobs are available
   */
  async dequeue(): Promise<Job | null> {
    return dequeueJob();
  }

  /**
   * Get a job by ID
   */
  async getJob(id: string): Promise<Job | null> {
    return getJobById(id);
  }

  /**
   * Get all jobs with a specific status
   */
  async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    return getJobsByStatus(status);
  }

  /**
   * Get all jobs
   */
  async getAllJobs(): Promise<Job[]> {
    return getAllJobs();
  }

  /**
   * Get the currently running job (if any)
   */
  async getRunningJob(): Promise<Job | null> {
    return getRunningJob();
  }

  /**
   * Mark a job as completed
   */
  async complete(id: string): Promise<Job | null> {
    return updateJobStatus(id, "completed");
  }

  /**
   * Mark a job as failed with an error message
   */
  async fail(id: string, errorMessage: string): Promise<Job | null> {
    return updateJobStatus(id, "failed", errorMessage);
  }

  /**
   * Cancel a pending or running job
   */
  async cancel(id: string): Promise<Job | null> {
    return cancelJob(id);
  }

  /**
   * Update job iteration count
   */
  async updateIteration(id: string, iteration: number): Promise<Job | null> {
    return updateJobIteration(id, iteration);
  }

  /**
   * Update job PRD (for marking stories as complete)
   */
  async updatePrd(id: string, prd: Prd): Promise<Job | null> {
    return updateJobPrd(id, prd);
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const [pending, running, completed, failed] = await Promise.all([
      getJobsByStatus("pending"),
      getJobsByStatus("running"),
      getJobsByStatus("completed"),
      getJobsByStatus("failed"),
    ]);

    return {
      pending: pending.length,
      running: running.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  /**
   * Get number of pending jobs
   */
  async pendingCount(): Promise<number> {
    return countPendingJobs();
  }

  /**
   * Add a log entry for a job
   */
  async addLog(data: CreateJobLog): Promise<void> {
    return addJobLog(data);
  }

  /**
   * Get logs for a job
   */
  async getLogs(
    jobId: string,
    options?: { iteration?: number; afterId?: number }
  ): Promise<JobLog[]> {
    return getJobLogs(jobId, options);
  }

  /**
   * Delete all logs for a job
   */
  async deleteLogs(jobId: string): Promise<void> {
    return deleteJobLogs(jobId);
  }
}

// Export singleton instance
export const queue = new JobQueue();

// Re-export types
export type { Job, JobStatus, Prd, CreateJob, JobLog, CreateJobLog } from "@ralphberry/core";
