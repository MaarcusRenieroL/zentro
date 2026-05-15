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
