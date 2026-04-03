import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Client — lazily initialised so missing env vars don't crash startup
// ---------------------------------------------------------------------------

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY not set — emails will be skipped.");
    return null;
  }
  resend = new Resend(key);
  return resend;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TournamentUpdateContext {
  tournamentId: number;
  tournamentName: string;
  updatedByUsername: string;
  changes: Record<string, { from: string | number; to: string | number }>;
  recipients: Array<{ email: string; username: string }>;
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

function buildEmailHtml(ctx: TournamentUpdateContext): string {
  const changeRows = Object.entries(ctx.changes)
    .map(
      ([field, { from, to }]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;text-transform:capitalize;color:#374151;">
            ${field.replace(/_/g, " ")}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#9ca3af;text-decoration:line-through;">
            ${from}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-weight:600;">
            ${to}
          </td>
        </tr>`
    )
    .join("");

  const appUrl = process.env.APP_URL || "http://localhost:5172";
  const tournamentUrl = `${appUrl}/tournament/${ctx.tournamentId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tournament Update</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                🏆 Tournament Updated
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">
                ${ctx.tournamentName}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">
                Hi there,<br /><br />
                <strong>${ctx.updatedByUsername}</strong> just made changes to the tournament
                <strong>${ctx.tournamentName}</strong> that you are a member of.
              </p>

              <!-- Changes table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">Field</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">Before</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;">After</th>
                  </tr>
                </thead>
                <tbody>
                  ${changeRows}
                </tbody>
              </table>

              <!-- CTA -->
              <a href="${tournamentUrl}"
                 style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">
                View Tournament →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You received this email because you are a member of
                <strong>${ctx.tournamentName}</strong>.
                This is an automated notification from Tournament Tracker.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a tournament-update notification to every listed recipient.
 * Fires all sends concurrently and logs per-address failures without
 * throwing — email is best-effort and should never block the HTTP response.
 */
export async function sendTournamentUpdateEmails(
  ctx: TournamentUpdateContext
): Promise<void> {
  const client = getClient();
  if (!client) return;
  if (ctx.recipients.length === 0) return;
  if (Object.keys(ctx.changes).length === 0) return;

  const from =
    process.env.EMAIL_FROM || "Tournament Tracker <onboarding@resend.dev>";
  const subject = `[${ctx.tournamentName}] Tournament has been updated`;
  const html = buildEmailHtml(ctx);

  const sends = ctx.recipients.map(async ({ email, username }) => {
    try {
      const { error } = await client.emails.send({
        from,
        to: email,
        subject,
        html,
      });
      if (error) {
        console.error(`[Email] Failed to send to ${email}:`, error);
      } else {
        console.log(`[Email] Sent update notification to ${email} (${username})`);
      }
    } catch (err) {
      console.error(`[Email] Unexpected error sending to ${email}:`, err);
    }
  });

  await Promise.all(sends);
}
