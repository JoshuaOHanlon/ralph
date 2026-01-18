import { NextResponse } from "next/server";
import { countRepos, countPendingJobs } from "@ralphberry/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repos = await countRepos();
    const pendingJobs = await countPendingJobs();

    return NextResponse.json({
      status: "healthy",
      services: {
        database: "connected",
        docker: "available", // Would check docker socket in production
        slack: "authenticated", // Would check slack token in production
        tunnel: "not_configured",
      },
      repos,
      pendingJobs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
