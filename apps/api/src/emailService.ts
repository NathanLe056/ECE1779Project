import { Resend } from "resend";
import { emailsSentTotal } from "./metrics.js";

// Lazy-init so missing env vars don't crash startup
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

function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:5172";
}

function tournamentUrl(id: number): string {
  return `${getAppUrl()}/tournament/${id}`;
}

// shared send helper
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getClient();
  if (!client) {
    emailsSentTotal.inc({ result: "skipped" });
    return;
  }
  const from = process.env.EMAIL_FROM || "Tournament Tracker <onboarding@resend.dev>";
  try {
    const { error } = await client.emails.send({ from, to, subject, html });
    if (error) {
      emailsSentTotal.inc({ result: "failed" });
      console.error(`[Email] Failed to send to ${to}:`, error);
    } else {
      emailsSentTotal.inc({ result: "success" });
      console.log(`[Email] Sent "${subject}" to ${to}`);
    }
  } catch (err) {
    emailsSentTotal.inc({ result: "failed" });
    console.error(`[Email] Unexpected error sending to ${to}:`, err);
  }
}

async function sendToAll(
  recipients: Array<{ email: string; username: string }>,
  subject: string,
  html: string
): Promise<void> {
  if (recipients.length === 0) return;
  await Promise.all(recipients.map(({ email }) => sendEmail(email, subject, html)));
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface TournamentUpdateContext {
  tournamentId: number;
  tournamentName: string;
  updatedByUsername: string;
  changes: Record<string, { from: string | number; to: string | number }>;
  recipients: Array<{ email: string; username: string }>;
}

export interface TournamentDeletedContext {
  tournamentId: number;
  tournamentName: string;
  deletedByUsername: string;
  recipients: Array<{ email: string; username: string }>;
}

export interface MemberJoinedContext {
  tournamentId: number;
  tournamentName: string;
  newMemberUsername: string;
  newMemberEmail: string;
  existingMembers: Array<{ email: string; username: string }>;
}

export interface MemberRemovedContext {
  tournamentId: number;
  tournamentName: string;
  removedMemberEmail: string;
  removedMemberUsername: string;
  removedByUsername: string;
}

export interface MatchResultContext {
  tournamentId: number;
  tournamentName: string;
  roundNumber: number;
  matchOrder: number;
  winnerUsername: string;
  recipients: Array<{ email: string; username: string }>;
}

export interface BracketGeneratedContext {
  tournamentId: number;
  tournamentName: string;
  generatedByUsername: string;
  recipients: Array<{ email: string; username: string }>;
}

// ── HTML builders ──────────────────────────────────────────────────────────

function wrapEmail(title: string, color: string, body: string, tournamentId?: number): string {
  const url = tournamentId ? tournamentUrl(tournamentId) : null;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr><td style="background:${color};padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#374151;font-size:15px;">
          ${body}
          ${url ? `<p style="margin-top:24px;"><a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">View Tournament</a></p>` : ""}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Automated notification from Tournament Tracker.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Senders ────────────────────────────────────────────────────────────────

export async function sendTournamentUpdateEmails(ctx: TournamentUpdateContext): Promise<void> {
  if (!getClient()) { emailsSentTotal.inc({ result: "skipped" }, ctx.recipients.length); return; }
  if (ctx.recipients.length === 0 || Object.keys(ctx.changes).length === 0) return;

  const changeRows = Object.entries(ctx.changes)
    .map(([field, { from, to }]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;text-transform:capitalize;color:#374151;">${field.replace(/_/g, " ")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#9ca3af;text-decoration:line-through;">${from}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-weight:600;">${to}</td>
      </tr>`)
    .join("");

  const body = `
    <p>Hi there,<br/><br/><strong>${ctx.updatedByUsername}</strong> made changes to <strong>${ctx.tournamentName}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <thead><tr style="background:#f9fafb;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Field</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Before</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">After</th>
      </tr></thead>
      <tbody>${changeRows}</tbody>
    </table>`;

  const html = wrapEmail("Tournament Updated", "#1d4ed8", body, ctx.tournamentId);
  const subject = `[${ctx.tournamentName}] Tournament has been updated`;
  await sendToAll(ctx.recipients, subject, html);
}

export async function sendTournamentDeletedEmails(ctx: TournamentDeletedContext): Promise<void> {
  if (!getClient()) { emailsSentTotal.inc({ result: "skipped" }, ctx.recipients.length); return; }
  if (ctx.recipients.length === 0) return;

  const body = `<p>Hi there,<br/><br/>The tournament <strong>${ctx.tournamentName}</strong> has been deleted by <strong>${ctx.deletedByUsername}</strong>.<br/><br/>You will no longer receive notifications for this tournament.</p>`;
  const html = wrapEmail("Tournament Deleted", "#dc2626", body);
  const subject = `[${ctx.tournamentName}] Tournament has been deleted`;
  await sendToAll(ctx.recipients, subject, html);
}

export async function sendMemberJoinedEmails(ctx: MemberJoinedContext): Promise<void> {
  if (!getClient()) {
    emailsSentTotal.inc({ result: "skipped" }, ctx.existingMembers.length + 1);
    return;
  }

  const url = tournamentUrl(ctx.tournamentId);

  // Welcome email to the new member
  const welcomeBody = `<p>Hi <strong>${ctx.newMemberUsername}</strong>,<br/><br/>You have successfully joined the tournament <strong>${ctx.tournamentName}</strong>. Good luck!</p>`;
  const welcomeHtml = wrapEmail("Welcome to the Tournament!", "#16a34a", welcomeBody, ctx.tournamentId);
  await sendEmail(ctx.newMemberEmail, `[${ctx.tournamentName}] You joined the tournament`, welcomeHtml);

  // Notify existing members
  if (ctx.existingMembers.length > 0) {
    const notifyBody = `<p>Hi there,<br/><br/><strong>${ctx.newMemberUsername}</strong> has joined <strong>${ctx.tournamentName}</strong>.</p>`;
    const notifyHtml = wrapEmail("New Member Joined", "#7c3aed", notifyBody, ctx.tournamentId);
    await sendToAll(ctx.existingMembers, `[${ctx.tournamentName}] New member joined`, notifyHtml);
  }
}

export async function sendMemberRemovedEmail(ctx: MemberRemovedContext): Promise<void> {
  if (!getClient()) { emailsSentTotal.inc({ result: "skipped" }); return; }

  const body = `<p>Hi <strong>${ctx.removedMemberUsername}</strong>,<br/><br/>You have been removed from the tournament <strong>${ctx.tournamentName}</strong> by <strong>${ctx.removedByUsername}</strong>.</p>`;
  const html = wrapEmail("Removed from Tournament", "#f59e0b", body);
  await sendEmail(ctx.removedMemberEmail, `[${ctx.tournamentName}] You were removed from the tournament`, html);
}

export async function sendMatchResultEmails(ctx: MatchResultContext): Promise<void> {
  if (!getClient()) { emailsSentTotal.inc({ result: "skipped" }, ctx.recipients.length); return; }
  if (ctx.recipients.length === 0) return;

  const roundName = ctx.roundNumber === 1 ? "Quarter-Final" : ctx.roundNumber === 2 ? "Semi-Final" : "Final";
  const body = `<p>Hi there,<br/><br/>A match result has been recorded in <strong>${ctx.tournamentName}</strong>.<br/><br/><strong>${roundName} Match ${ctx.matchOrder}</strong> — Winner: <strong>${ctx.winnerUsername}</strong></p>`;
  const html = wrapEmail("Match Result Updated", "#0891b2", body, ctx.tournamentId);
  const subject = `[${ctx.tournamentName}] ${roundName} result recorded`;
  await sendToAll(ctx.recipients, subject, html);
}

export async function sendBracketGeneratedEmails(ctx: BracketGeneratedContext): Promise<void> {
  if (!getClient()) { emailsSentTotal.inc({ result: "skipped" }, ctx.recipients.length); return; }
  if (ctx.recipients.length === 0) return;

  const body = `<p>Hi there,<br/><br/>The bracket for <strong>${ctx.tournamentName}</strong> has been generated by <strong>${ctx.generatedByUsername}</strong>. Head over to see your matches!</p>`;
  const html = wrapEmail("Bracket Ready!", "#16a34a", body, ctx.tournamentId);
  const subject = `[${ctx.tournamentName}] Bracket has been generated`;
  await sendToAll(ctx.recipients, subject, html);
}
