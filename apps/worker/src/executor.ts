import Docker from "dockerode";
import { Readable } from "stream";
import type { Job, Repo, Prd } from "@ralphberry/core";
import type { JobQueue } from "@ralphberry/queue";

const docker = new Docker();

const MEMORY_LIMIT = process.env.DOCKER_MEMORY_LIMIT ?? "4g";
const CPU_LIMIT = parseFloat(process.env.DOCKER_CPU_LIMIT ?? "2");
const CLAUDE_AUTH_MODE = process.env.CLAUDE_AUTH_MODE ?? "api_key";

function resolveAuthDir(): string {
  const authDir = process.env.CLAUDE_AUTH_DIR ?? `${process.env.HOME}/.claude-hub/auth`;
  // Expand ~ to home directory
  if (authDir.startsWith("~")) {
    return authDir.replace("~", process.env.HOME ?? "");
  }
  return authDir;
}

interface ExecutorConfig {
  memoryLimit: string;
  cpuLimit: number;
  networkMode: string;
}

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([gmk]?)$/i);
  if (!match) return 4 * 1024 * 1024 * 1024; // Default 4GB

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "b").toLowerCase();

  switch (unit) {
    case "g":
      return value * 1024 * 1024 * 1024;
    case "m":
      return value * 1024 * 1024;
    case "k":
      return value * 1024;
    default:
      return value;
  }
}

export class JobExecutor {
  private job: Job;
  private repo: Repo;
  private queue: JobQueue;
  private container: Docker.Container | null = null;
  private config: ExecutorConfig;

  constructor(job: Job, repo: Repo, queue: JobQueue) {
    this.job = job;
    this.repo = repo;
    this.queue = queue;
    this.config = {
      memoryLimit: MEMORY_LIMIT,
      cpuLimit: CPU_LIMIT,
      networkMode: process.env.DOCKER_NETWORK_MODE ?? "none",
    };
  }

  async execute(): Promise<void> {
    const workspaceDir = `/repos/${this.repo.slug}`;

    // Build environment variables based on auth mode
    const env: string[] = [
      `MAX_ITERATIONS=${this.job.maxIterations}`,
      `REPO_NAME=${this.repo.name}`,
    ];

    // Only pass API key if not using OAuth
    if (CLAUDE_AUTH_MODE !== "oauth") {
      env.push(`ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`);
    }

    // Build volume binds
    const binds: string[] = [
      `${workspaceDir}:/workspace`,
      `${process.env.HOME}/.ssh:/root/.ssh:ro`,
    ];

    // Mount OAuth credentials if using OAuth mode
    if (CLAUDE_AUTH_MODE === "oauth") {
      const authDir = resolveAuthDir();
      binds.push(`${authDir}:/home/node/.claude:ro`);
    }

    // Create container
    this.container = await docker.createContainer({
      Image: this.repo.dockerImage,
      Env: env,
      HostConfig: {
        Binds: binds,
        Memory: parseMemoryLimit(this.config.memoryLimit),
        NanoCpus: this.config.cpuLimit * 1e9,
        NetworkMode: this.config.networkMode,
        AutoRemove: true,
      },
      WorkingDir: "/workspace",
    });

    // Write PRD to workspace
    await this.writePrdToWorkspace(workspaceDir);

    // Start container
    await this.container.start();

    // Stream logs
    const logStream = await this.container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
    });

    await this.streamLogs(logStream);

    // Wait for container to finish
    const result = await this.container.wait();

    // Check exit code
    if (result.StatusCode !== 0) {
      throw new Error(`Container exited with code ${result.StatusCode}`);
    }

    // Read final PRD state and update job
    const finalPrd = await this.readPrdFromWorkspace(workspaceDir);
    if (finalPrd) {
      await this.queue.updatePrd(this.job.id, finalPrd);
    }

    // Mark job as complete
    await this.queue.complete(this.job.id);
  }

  async stop(): Promise<void> {
    if (this.container) {
      try {
        await this.container.stop({ t: 10 });
      } catch {
        // Container may have already stopped
      }
    }
  }

  private async writePrdToWorkspace(workspaceDir: string): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");

    const prdPath = path.join(workspaceDir, "prd.json");
    await fs.writeFile(prdPath, JSON.stringify(this.job.prd, null, 2));
  }

  private async readPrdFromWorkspace(workspaceDir: string): Promise<Prd | null> {
    const fs = await import("fs/promises");
    const path = await import("path");

    try {
      const prdPath = path.join(workspaceDir, "prd.json");
      const content = await fs.readFile(prdPath, "utf-8");
      return JSON.parse(content) as Prd;
    } catch {
      return null;
    }
  }

  private async streamLogs(logStream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
      let iteration = 0;
      const iterationPattern = /Ralphberry Iteration (\d+) of/;

      logStream.on("data", async (chunk: Buffer) => {
        const text = chunk.toString("utf-8");
        const lines = text.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          // Check for iteration updates
          const match = line.match(iterationPattern);
          if (match) {
            iteration = parseInt(match[1], 10);
            await this.queue.updateIteration(this.job.id, iteration);
          }

          // Determine stream type (Docker multiplexes stdout/stderr)
          const isStderr = chunk[0] === 2;

          // Log to console
          const stream = isStderr ? "stderr" : "stdout";
          console.log(`[Job ${this.job.id}] [${stream}] ${line}`);

          // Store in database
          await this.queue.addLog({
            jobId: this.job.id,
            iteration,
            stream: isStderr ? "stderr" : "stdout",
            content: line,
            timestamp: Date.now(),
          });
        }
      });

      logStream.on("end", () => resolve());
      logStream.on("error", reject);
    });
  }
}
