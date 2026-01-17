import { queue } from "@ralph/queue";
import { getRepoById } from "@ralph/db";
import { JobExecutor } from "./executor.js";

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL ?? "5000", 10);

let isShuttingDown = false;
let currentExecutor: JobExecutor | null = null;

async function pollForJobs() {
  if (isShuttingDown) return;

  try {
    // Try to dequeue the next job
    const job = await queue.dequeue();

    if (job) {
      console.log(`[Worker] Starting job ${job.id}`);
      console.log(`[Worker]   Repo: ${job.repoId}`);
      console.log(`[Worker]   PRD: ${job.prd.description}`);

      // Get repo configuration
      const repo = await getRepoById(job.repoId);
      if (!repo) {
        console.error(`[Worker] Repo not found: ${job.repoId}`);
        await queue.fail(job.id, "Repository not found");
        return;
      }

      // Create executor and run the job
      currentExecutor = new JobExecutor(job, repo, queue);

      try {
        await currentExecutor.execute();
        console.log(`[Worker] Job ${job.id} completed`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Worker] Job ${job.id} failed:`, message);
        await queue.fail(job.id, message);
      } finally {
        currentExecutor = null;
      }
    }
  } catch (error) {
    console.error("[Worker] Error polling for jobs:", error);
  }

  // Schedule next poll
  if (!isShuttingDown) {
    setTimeout(pollForJobs, POLL_INTERVAL);
  }
}

async function shutdown(signal: string) {
  console.log(`\n[Worker] Received ${signal}, shutting down...`);
  isShuttingDown = true;

  if (currentExecutor) {
    console.log("[Worker] Waiting for current job to complete...");
    // Give some time for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (currentExecutor) {
      console.log("[Worker] Forcefully stopping container...");
      await currentExecutor.stop();
    }
  }

  console.log("[Worker] Shutdown complete");
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start the worker
console.log("[Worker] Starting Ralph Worker");
console.log(`[Worker] Poll interval: ${POLL_INTERVAL}ms`);

// Initial poll
pollForJobs();
