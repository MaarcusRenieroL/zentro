import { Resend } from "resend";
import { authEnv } from "./env";
import { Invitation, Organization } from "better-auth/plugins";
import { User } from "better-auth";

const resend = new Resend(authEnv.RESEND_API_KEY);

function getAppUrl() {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

export async function sendVerificationEmail(email: string, otp: string) {
  await resend.emails.send({
    from: authEnv.EMAIL_FROM,
    to: email,
    subject: "Verify your email",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;color:#e5e7eb;font-family: Inter, Arial, Sans-serif">
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
    from: authEnv.EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;color:#e5e7eb;font-family: Inter, Arial, Sans-serif">
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

export async function sendOrgInviteEmail(
  invitation: Invitation,
  organization: Organization,
  inviter: {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    user: User;
  },
) {
  const appUrl = getAppUrl();

  const inviteUrl = `${appUrl}/auth/invite/${encodeURIComponent(
    invitation.id,
  )}`;

  const inviterName = inviter.user.name ?? inviter.user.email ?? "A teammate";
  const organizationName = organization.name;

  const role = invitation.role
    ? invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)
    : "Member";

  await resend.emails.send({
    from: authEnv.EMAIL_FROM,
    to: invitation.email,
    subject: `You're invited to join ${organizationName} on Zentro`,
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;color:#e5e7eb;font-family: Inter, Arial, Sans-serif">
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
                You're invited to join ${organizationName}
              </h1>

              <p style="margin:0 0 16px;color:#d1d5db;line-height:1.5;">
                ${inviterName} invited you to join <strong>${organizationName}</strong> on Zentro.
              </p>

              <p style="margin:0 0 24px;color:#d1d5db;line-height:1.5;">
                Your role will be <strong>${role}</strong>.
              </p>

              <a
                href="${inviteUrl}"
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
                Accept invitation
              </a>

              <p style="margin:0 0 12px;color:#9ca3af;font-size:14px;line-height:1.5;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.5;word-break:break-all;">
                <a href="${inviteUrl}" style="color:#93c5fd;">
                  ${inviteUrl}
                </a>
              </p>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;line-height:1.5;">
                This invitation expires in 7 days. If you were not expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
