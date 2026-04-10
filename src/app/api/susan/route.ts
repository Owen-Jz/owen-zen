import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { MongoClient, ObjectId } from 'mongodb';

const execPromise = promisify(execFile);

// Environment-based paths - MUST be configured via environment variables
const SCRAPER_DIR = process.env.SCRAPER_DIR;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR;
const SCRIPTS_DIR = SCRAPER_DIR ? path.join(SCRAPER_DIR, "scripts") : undefined;

// MongoDB Config from environment
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "test";

// Validate required environment variables
function validateEnvironment(): string | null {
  if (!MONGO_URI) {
    return "MONGODB_URI environment variable is not set";
  }
  if (!SCRIPTS_DIR) {
    return "SCRAPER_DIR environment variable is not set";
  }
  return null;
}

// Validate that a path is safe (no directory traversal)
function validatePath(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return !normalized.includes('..') && path.isAbsolute(normalized);
}

// Sanitize string input for command arguments
function sanitizeInput(input: string): string {
  return input.replace(/[`$"\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  const validationError = validateEnvironment();
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  let client;
  try {
    client = await MongoClient.connect(MONGO_URI!);
    const db = client.db(DB_NAME);

    if (action === "get-dominance-logs") {
      const logs = await db.collection("dominance_logs")
        .find({})
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      return NextResponse.json({ logs });
    }

    if (action === "get-strategic-intel") {
      const intel = await db.collection("strategic_intel")
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      return NextResponse.json({ intel });
    }

    if (action === "get-leads") {
      const leads = await db.collection("lead_hunter")
        .find({ status: "pending" })
        .sort({ timestamp: -1 })
        .toArray();
      const formattedLeads = leads.map(l => ({ ...l, id: l._id.toString() }));
      return NextResponse.json({ leads: formattedLeads });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const validationError = validateEnvironment();
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 500 });
    }

    const { action, leadId, mode } = await req.json();
    let client;

    if (action === "email-dispatch") {
      // Validate leadId format
      if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
      }

      // Validate mode
      if (mode && !['preview', 'send'].includes(mode)) {
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
      }

      client = await MongoClient.connect(MONGO_URI!);
      const db = client.db(DB_NAME);

      // Validate leadId is a valid ObjectId
      let objectId: ObjectId;
      try {
        objectId = new ObjectId(leadId);
      } catch {
        return NextResponse.json({ error: "Invalid leadId format" }, { status: 400 });
      }

      const lead = await db.collection("lead_hunter").findOne({ _id: objectId });
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      // Use a safe temporary path in system temp directory
      const tempPath = path.join('/tmp', `draft_${leadId}_${Date.now()}.txt`);

      // Sanitize and validate the email content
      const emailContent = typeof lead.email_draft === 'string' ? lead.email_draft : '';
      await fs.writeFile(tempPath, emailContent, { mode: 0o600 });

      // Determine target email
      const targetEmail = mode === 'preview' ? "official@owendigitals.work" : lead.contact_email;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(targetEmail)) {
        await fs.unlink(tempPath).catch(() => {});
        return NextResponse.json({ error: "Invalid target email" }, { status: 400 });
      }

      // Use execFile with array of arguments to prevent command injection
      const scriptPath = path.join(SCRIPTS_DIR!, "send_leads.py");

      // Validate paths are safe
      if (!validatePath(scriptPath) || !validatePath(tempPath)) {
        await fs.unlink(tempPath).catch(() => {});
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      // Execute with arguments as array (safe from injection)
      await execPromise('python3', [scriptPath, tempPath, sanitizeInput(targetEmail), sanitizeInput(lead.subject || '')]);

      // Clean up temp file after execution
      await fs.unlink(tempPath).catch(() => {});

      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ error: "Unknown command" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
