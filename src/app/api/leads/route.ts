import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  await dbConnect();
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, email, source, message } = body;

    // Save lead to DB
    const lead = await Lead.create({ name, email, source, message });

    // Send welcome email via Resend
    try {
      await resend.emails.send({
        from: "Owen Digitals <onboarding@resend.dev>",
        to: email,
        replyTo: "owen@owendigitals.com",
        subject: `Hey ${name}, got your details 👋`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111;">
            <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Hey ${name} 👋</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 16px;">
              Thanks for reaching out — I've got your details and will be in touch shortly.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 24px;">
              In the meantime, feel free to explore what I'm building at 
              <a href="https://owendigitals.com" style="color: #dc2626; text-decoration: none;">owendigitals.com</a>.
            </p>
            <p style="font-size: 14px; color: #888;">
              — Owen Egbagba<br/>
              <a href="https://owendigitals.com" style="color: #dc2626;">Owen Digitals</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Log but don't fail — lead is already saved
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
