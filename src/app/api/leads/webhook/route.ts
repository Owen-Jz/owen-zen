import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { NextResponse } from "next/server";

// Telegram credentials from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram credentials not configured - skipping alert");
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend webhook payload can vary — handle multiple formats
    const eventType = payload.type || payload.event || "";
    const data = payload.data || payload;

    const fromEmail: string = data.from || data.sender || "";
    const subject: string = data.subject || "(no subject)";
    const textBody: string = data.text || data.body || data.snippet || "";
    const snippet = textBody.slice(0, 200).replace(/\n+/g, " ").trim();

    if (!fromEmail) {
      return NextResponse.json({ received: true, skipped: "no sender" });
    }

    // Only process reply/inbound events — skip delivery receipts etc.
    const isReply =
      eventType.includes("replied") ||
      eventType.includes("inbound") ||
      eventType.includes("received") ||
      !eventType; // treat unknown events as replies (inbound webhook)

    if (!isReply) {
      return NextResponse.json({ received: true, skipped: `event: ${eventType}` });
    }

    await dbConnect();

    // Find lead by email
    const cleanEmail = fromEmail.replace(/.*<(.+)>/, "$1").trim().toLowerCase();
    const lead = await Lead.findOne({ email: cleanEmail });

    let leadName = cleanEmail;
    if (lead) {
      leadName = lead.name;
      await Lead.findByIdAndUpdate(lead._id, {
        $inc: { replyCount: 1 },
        lastReplyAt: new Date(),
        status: "replied",
      });
    }

    // Fire Telegram notification
    const tgMessage = [
      `🔔 *Lead Reply*`,
      ``,
      `*From:* ${leadName} (${cleanEmail})`,
      `*Subject:* ${subject}`,
      snippet ? `\n_${snippet}${textBody.length > 200 ? "…" : ""}_` : "",
      ``,
      `[View in Dashboard](https://owen-zen.vercel.app)`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    await sendTelegramAlert(tgMessage);

    return NextResponse.json({ received: true, lead: lead ? lead._id : null });
  } catch (error) {
    console.error("Leads webhook error:", error);
    return NextResponse.json({ received: true, error: String(error) }, { status: 200 }); // Always 200 to Resend
  }
}
