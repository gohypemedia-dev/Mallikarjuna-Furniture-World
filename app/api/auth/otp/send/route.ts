import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreOtp } from "@/lib/server/auth/otp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "Email address or phone number is required" },
        { status: 400 }
      );
    }

    // ─── 1. EMAIL OTP (Account Creation / Verification) ──────────────────────
    if (email) {
      const { otp, identifier: cleanEmail } = generateAndStoreOtp(email);

      // Dispatch Email OTP via configured SMTP provider
      import("@/lib/server/mail").then(({ sendEmail }) => {
        sendEmail({
          to: cleanEmail,
          subject: `${otp} is your XElectron verification code`,
          html: `
            <div style="max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border: 1px solid #d7d4cf; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: #000000; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">XELECTRON</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Official Account Verification</p>
              </div>
              <div style="padding: 32px 28px; text-align: center; color: #1f1e1b;">
                <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #000000;">Verify Your Email Address</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #5c5951; margin: 0 0 24px;">
                  Thank you for creating an account with XElectron. Use the 6-digit verification code below to verify your email address:
                </p>
                <div style="display: inline-block; background: #fbf7ef; border: 2px dashed #000000; border-radius: 12px; padding: 14px 36px; margin: 0 auto 24px;">
                  <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #000000; font-family: monospace;">${otp}</span>
                </div>
                <p style="font-size: 13px; color: #8e8a82; margin: 0;">
                  This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
                </p>
              </div>
              <div style="background: #fbf7ef; padding: 16px; text-align: center; border-top: 1px solid #d7d4cf; font-size: 12px; color: #8e8a82;">
                &copy; ${new Date().getFullYear()} XElectron Technologies. All rights reserved.
              </div>
            </div>
          `,
        }).catch((err) => console.warn("[OTP] Email delivery warning:", err));
      });

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${cleanEmail}`,
        email: cleanEmail,
      });
    }

    // ─── 2. PHONE OTP (COD Verification / SMS) ────────────────────────────────
    if (phone) {
      const { otp, identifier: cleanPhone } = generateAndStoreOtp(phone);

      // Dispatch SMS to mobile via SMS Alert India (smsalert.co.in)
      import("@/lib/server/sms/smsalert").then(({ sendOtpSms }) => {
        sendOtpSms(cleanPhone, otp).catch((err) =>
          console.warn("[OTP] SMS Alert delivery warning:", err)
        );
      });

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to +91 ${cleanPhone}`,
        phone: cleanPhone,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
