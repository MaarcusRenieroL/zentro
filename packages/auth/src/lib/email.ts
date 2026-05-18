import { Resend } from "resend";
import { authEnv } from "./env";

const resend = new Resend(authEnv.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, otp: string) {
  await resend.emails.send({
    from: "Zentro <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;color:#e5e7eb;font-family: Geist, Inter, Arial, Sans-serif">
        <table style="
          max-width:560px;
          margin:auto;
          background:#111827;
          padding:40px;
          border-radius:16px;
        ">
          <tr>
            <td align="center">
              <h1>Verify your email</h1>

              <p>
                Use this verification code to complete setup.
              </p>

              <div style="
                padding:18px 28px;
                font-size:34px;
                letter-spacing:10px;
                font-weight:700;
              ">
                ${otp}
              </div>

              <p>This code will expire shortly.</p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function sendForgotPasswordEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: "Zentro <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;color:#e5e7eb;font-family: Geist, Inter, Arial, Sans-serif">
        <table style="
          max-width:560px;
          margin:auto;
          background:#111827;
          padding:40px;
          border-radius:16px;
        ">
          <tr>
            <td align="center">
              <h1 style="margin:0 0 16px;color:#f9fafb;">
                Reset your password
              </h1>

              <p style="margin:0 0 24px;color:#d1d5db;line-height:1.5;">
                We received a request to reset your Zentro password.
                Click the button below to create a new password.
              </p>

              <a
                href="${resetUrl}"
                style="
                  display:inline-block;
                  background:#f9fafb;
                  color:#111827;
                  text-decoration:none;
                  padding:14px 22px;
                  border-radius:10px;
                  font-weight:700;
                  margin:8px 0 24px;
                "
              >
                Reset password
              </a>

              <p style="margin:0 0 12px;color:#9ca3af;font-size:14px;line-height:1.5;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;word-break:break-all;">
                <a href="${resetUrl}" style="color:#93c5fd;">
                  ${resetUrl}
                </a>
              </p>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;line-height:1.5;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
