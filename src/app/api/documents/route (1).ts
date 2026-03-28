import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,           // recipient email
      subject,
      html,         // email body HTML
      attachments,  // optional: [{ filename, content (base64) }]
    } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
    }

    const emailData: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: { filename: string; content: Buffer }[];
    } = {
      from: process.env.RESEND_FROM_EMAIL || "MMT 공연관리 <onboarding@resend.dev>",
      to,
      subject,
      html: html || "",
    };

    // Handle attachments (PDF base64)
    if (attachments?.length) {
      emailData.attachments = attachments.map((att: { filename: string; content: string }) => ({
        filename: att.filename,
        content: Buffer.from(att.content, "base64"),
      }));
    }

    const result = await resend.emails.send(emailData);

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
