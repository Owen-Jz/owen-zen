import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { MongoClient, ObjectId } from 'mongodb';

const execPromise = promisify(exec);

// Absolute paths
const SCRAPER_DIR = "/Users/owen/.openclaw/workspace/job-alpha";
const WORKSPACE_DIR = "/Users/owen/.openclaw/workspace";
const SCRIPTS_DIR = path.join(WORKSPACE_DIR, "scripts");
const MONGO_URI = "mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "test";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === "get-dominance-logs") {
    let client;
    try {
      client = await MongoClient.connect(MONGO_URI);
      const db = client.db(DB_NAME);
      const logs = await db.collection("dominance_logs")
        .find({})
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      return NextResponse.json({ logs });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
      if (client) await client.close();
    }
  }

  if (action === "get-leads") {
    let client;
    try {
      client = await MongoClient.connect(MONGO_URI);
      const db = client.db(DB_NAME);
      const leads = await db.collection("lead_hunter")
        .find({ status: "pending" })
        .sort({ timestamp: -1 })
        .toArray();
      const formattedLeads = leads.map(l => ({ ...l, id: l._id.toString() }));
      return NextResponse.json({ leads: formattedLeads });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      if (client) await client.close();
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const { action, leadId, mode } = await req.json();
    let client;

    if (action === "email-dispatch") {
      client = await MongoClient.connect(MONGO_URI);
      const db = client.db(DB_NAME);
      const lead = await db.collection("lead_hunter").findOne({ _id: new ObjectId(leadId) });
      if (!lead) throw new Error("Lead not found");
      const tempPath = `/tmp/draft_${leadId}.txt`;
      await fs.writeFile(tempPath, lead.email_draft);
      const targetEmail = mode === 'preview' ? "official@owendigitals.work" : lead.contact_email;
      const cmd = `python3 "${path.join(SCRIPTS_DIR, "send_leads.py")}" "${tempPath}" "${targetEmail}" "${lead.subject}"`;
      await execPromise(cmd);
      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ error: "Unknown command" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
