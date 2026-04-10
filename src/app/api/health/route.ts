import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {} as Record<string, { status: string; latency?: number; error?: string }>,
  };

  let allHealthy = true;

  // Check MongoDB connection
  try {
    const start = Date.now();
    await dbConnect();
    health.services.mongodb = {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error: any) {
    allHealthy = false;
    health.services.mongodb = {
      status: "unhealthy",
      error: error.message || "Connection failed",
    };
  }

  // Check environment variables
  const requiredEnvVars = [
    "MONGODB_URI",
  ];

  const envStatus: Record<string, string> = {};
  let envHealthy = true;
  for (const varName of requiredEnvVars) {
    const isSet = !!process.env[varName];
    envStatus[varName] = isSet ? "set" : "missing";
    if (!isSet) envHealthy = false;
  }

  health.services.environment = {
    status: envHealthy ? "healthy" : "unhealthy",
  };

  if (!envHealthy) {
    health.services.environment.error = `Missing: ${Object.entries(envStatus)
      .filter(([, v]) => v === "missing")
      .map(([k]) => k)
      .join(", ")}`;
    allHealthy = false;
  }

  // Overall status
  health.status = allHealthy ? "ok" : "degraded";

  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
