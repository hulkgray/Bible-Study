import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("[Email] RESEND_API_KEY is not configured. Add it to .env.local");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Sends a password reset email with a styled HTML template.
 * The resetUrl should include the raw token as a query parameter.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = getResend();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Reset your Bible Study password",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:480px;margin:40px auto;padding:32px;background-color:#1a1a1a;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="color:#d4a843;font-size:28px;">✦</span>
            <h1 style="color:#f0f0f0;font-size:20px;margin:8px 0 0;">Bible Study</h1>
          </div>
          <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin-bottom:24px;">
            You requested a password reset. Click the button below to set a new password.
            This link will expire in <strong style="color:#f0f0f0;">1 hour</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;background-color:#d4a843;color:#000;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;">
              Reset Password
            </a>
          </div>
          <p style="color:#666;font-size:12px;line-height:1.5;">
            If you didn&apos;t request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0 16px;" />
          <p style="color:#444;font-size:11px;text-align:center;">
            Bible Study Tool — Study Scripture with AI-Powered Tools
          </p>
        </div>
      </body>
      </html>
    `,
  });
}
