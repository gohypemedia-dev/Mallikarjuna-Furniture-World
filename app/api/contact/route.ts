import { db } from "@/lib/db";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, sendInquiryCustomerEmail } from "@/lib/server/mail";
import { getDepartmentEmail } from "@/lib/shared/contact-departments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().max(40).optional(),
        department: z.string().trim().max(120).optional(),
        targetEmail: z.string().trim().email().max(254).optional(),
        message: z.string().trim().min(1).max(10000),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid name, email and message." },
        { status: 400 }
      );
    }

    const { name, email, phone, department, message, targetEmail: preferredEmail } = parsed.data;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Dynamically route to correct department email based on department selection or whitelist
    const targetEmail = getDepartmentEmail(department, preferredEmail);

    const saved = await db.supportRequest.create({
      data: {
        kind: department?.includes("Warranty") ? "WARRANTY" : "INQUIRY",
        details: {
          ...parsed.data,
          routedToEmail: targetEmail,
        },
      },
    });

    // 1. Send Notification Email to Internal Team
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
    const adminNotificationHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f1e1b; line-height: 1.6; background-color: #fbf7ef;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #d7d4cf; border-radius: 12px; overflow: hidden;">
            <div style="background: #000000; color: white; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 18px; color: #b2aea7;">[New Website Inquiry]</h2>
              <p style="margin: 4px 0 0 0; color: #8e8a82; font-size: 12px;">Routed to: ${targetEmail}</p>
            </div>
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr style="border-bottom: 1px solid #f3f0ea;">
                  <td style="padding: 6px 0; color: #5c5951; font-size: 13px; font-weight: bold; width: 120px;">Department:</td>
                  <td style="padding: 6px 0; color: #000000; font-size: 13px; font-weight: bold;">${escapeHtml(department || "General Inquiry")}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f0ea;">
                  <td style="padding: 6px 0; color: #5c5951; font-size: 13px; font-weight: bold;">Customer Name:</td>
                  <td style="padding: 6px 0; color: #000000; font-size: 13px; font-weight: bold;">${escapeHtml(name)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f0ea;">
                  <td style="padding: 6px 0; color: #5c5951; font-size: 13px; font-weight: bold;">Email:</td>
                  <td style="padding: 6px 0; color: #000000; font-size: 13px;"><a href="mailto:${email}" style="color: #000000;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #5c5951; font-size: 13px; font-weight: bold;">Phone:</td>
                  <td style="padding: 6px 0; color: #000000; font-size: 13px;">${phone || "Not provided"}</td>
                </tr>
              </table>
              <div style="background: #fbf7ef; border-left: 3px solid #000000; padding: 14px 16px; border-radius: 6px;">
                <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 12px; color: #5c5951; text-transform: uppercase;">Message:</p>
                <p style="margin: 0; white-space: pre-wrap; font-size: 13px; color: #1f1e1b;">${escapeHtml(message)}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const delivery = await sendEmail({
      to: targetEmail,
      subject: `[Website Inquiry] ${name} - ${department || "General Inquiry"}`,
      html: adminNotificationHtml,
      text: `New Website Inquiry\n\nDepartment: ${department || "General Inquiry"}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}`,
      replyTo: email,
    });

    // 2. Send Premium Branded Confirmation Email to Customer
    if (delivery.success) await sendInquiryCustomerEmail({
      name,
      email,
      department: department || "Customer Support",
      message,
      targetEmail,
    });

    return NextResponse.json({
      success: true,
      reference: saved.id,
      recipientEmail: targetEmail,
      message: `Your request has been received and routed to ${targetEmail}.`,
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    const message = error instanceof Error ? error.message : "Failed to send inquiry";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
