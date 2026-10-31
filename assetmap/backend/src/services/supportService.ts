import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { pool } from '../db/connection';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { CLAUDE_MODELS, describeClaudeError, generateJSON, getClaude } from '../ai/claudeClient';

// ─────────────────────────────────────────────────────
// Support tickets: a user-owned thread of messages. Every query is scoped by user_id.
// There is no real-time human chat — the support team replies asynchronously; an
// optional automated assistant posts a clearly-labelled first reply.
// ─────────────────────────────────────────────────────

export const SUPPORT_CATEGORIES = [
  'account', 'consent', 'assets', 'property', 'nominee',
  'will', 'family', 'billing', 'privacy', 'bug', 'other',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_LIMITS = {
  subjectMin: 3,
  subjectMax: 150,
  messageMax: 4000,
  maxOpenTickets: 5,
} as const;

export class SupportError extends Error {
  constructor(message: string, public statusCode: 400 | 404 | 409 = 400, public code = 'SUPPORT_ERROR') {
    super(message);
  }
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'agent' | 'assistant' | 'system';
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  reference: string;
  category: SupportCategory;
  subject: string;
  channel: 'chat' | 'email';
  status: 'open' | 'awaiting_user' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages?: SupportMessage[];
  lastMessage?: { sender: SupportMessage['sender']; preview: string } | null;
  messageCount?: number;
}

/** Strip control characters (keep newlines/tabs) and collapse runs of blank lines. */
export function cleanText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Data minimisation before anything leaves our servers (AI assistant, email inbox):
 * mask Aadhaar/account/card numbers, PAN, phone numbers and email addresses.
 */
export function redactPII(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi, '[PAN]')
    .replace(/(?:\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, '[phone]')
    .replace(/\b(?:\d[\s-]?){8,19}\b/g, '[number]');
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function newReference(): string {
  // Crockford-ish alphabet without look-alikes (0/O, 1/I/L)
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  return 'CS-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function toTicket(row: any): SupportTicket {
  return {
    id: row.id,
    reference: row.reference,
    category: row.category,
    subject: row.subject,
    channel: row.channel,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

function toMessage(row: any): SupportMessage {
  return { id: row.id, sender: row.sender, body: row.body, createdAt: row.created_at };
}

async function ownedTicket(userId: string, ticketId: string): Promise<any> {
  const r = await pool.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [ticketId, userId]);
  if (!r.rows[0]) throw new SupportError('Ticket not found', 404, 'NOT_FOUND');
  return r.rows[0];
}

export const supportService = {
  async createTicket(
    userId: string,
    input: { category: SupportCategory; subject: string; message: string; channel: 'chat' | 'email' }
  ): Promise<SupportTicket> {
    const subject = cleanText(input.subject).replace(/\s+/g, ' ');
    const message = cleanText(input.message);
    if (!(SUPPORT_CATEGORIES as readonly string[]).includes(input.category)) throw new SupportError('Choose a topic');
    if (subject.length < SUPPORT_LIMITS.subjectMin || subject.length > SUPPORT_LIMITS.subjectMax) {
      throw new SupportError(`Subject must be ${SUPPORT_LIMITS.subjectMin}–${SUPPORT_LIMITS.subjectMax} characters`);
    }
    if (message.length < 2 || message.length > SUPPORT_LIMITS.messageMax) {
      throw new SupportError(`Message must be 2–${SUPPORT_LIMITS.messageMax} characters`);
    }

    const open = await pool.query(
      `SELECT COUNT(*)::int AS n FROM support_tickets WHERE user_id = $1 AND status <> 'closed'`, [userId]
    );
    if (open.rows[0].n >= SUPPORT_LIMITS.maxOpenTickets) {
      throw new SupportError(
        `You have ${SUPPORT_LIMITS.maxOpenTickets} open tickets. Add to one of them or close a resolved one first.`,
        409, 'TOO_MANY_OPEN'
      );
    }

    const client = await pool.connect();
    let ticketRow: any;
    try {
      await client.query('BEGIN');
      for (let attempt = 0; attempt < 5 && !ticketRow; attempt++) {
        const r = await client.query(
          `INSERT INTO support_tickets (reference, user_id, category, subject, channel)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (reference) DO NOTHING
           RETURNING *`,
          [newReference(), userId, input.category, subject, input.channel]
        );
        ticketRow = r.rows[0];
      }
      if (!ticketRow) throw new Error('Could not allocate a ticket reference');
      await client.query(
        `INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'user', $2)`,
        [ticketRow.id, message]
      );
      await client.query(
        `INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'system', $2)`,
        [ticketRow.id, `Ticket ${ticketRow.reference} created. Our support team replies within 1 business day — you'll see the reply here and under "My tickets".`]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const ticket = toTicket(ticketRow);
    // Side effects never block or fail the user's request
    void this.forwardToInbox(ticket, message, userId);
    void this.assistantFirstReply(ticket, message);

    return { ...ticket, messages: await this.messages(ticket.id) };
  },

  async listTickets(userId: string): Promise<SupportTicket[]> {
    const r = await pool.query(`
      SELECT t.*,
             (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count,
             lm.sender AS last_sender, lm.body AS last_body
        FROM support_tickets t
        LEFT JOIN LATERAL (
          SELECT sender, body FROM support_messages m
           WHERE m.ticket_id = t.id AND m.sender <> 'system'
           ORDER BY created_at DESC LIMIT 1
        ) lm ON true
       WHERE t.user_id = $1
       ORDER BY (t.status = 'closed'), t.updated_at DESC
       LIMIT 50
    `, [userId]);
    return r.rows.map((row: any) => ({
      ...toTicket(row),
      messageCount: row.message_count,
      lastMessage: row.last_body
        ? { sender: row.last_sender, preview: String(row.last_body).slice(0, 140) }
        : null,
    }));
  },

  async messages(ticketId: string): Promise<SupportMessage[]> {
    const r = await pool.query(
      'SELECT id, sender, body, created_at FROM support_messages WHERE ticket_id = $1 ORDER BY created_at, id',
      [ticketId]
    );
    return r.rows.map(toMessage);
  },

  async getTicket(userId: string, ticketId: string): Promise<SupportTicket> {
    const row = await ownedTicket(userId, ticketId);
    return { ...toTicket(row), messages: await this.messages(ticketId) };
  },

  async addMessage(userId: string, ticketId: string, body: string): Promise<SupportTicket> {
    const text = cleanText(body);
    if (text.length < 1 || text.length > SUPPORT_LIMITS.messageMax) {
      throw new SupportError(`Message must be 1–${SUPPORT_LIMITS.messageMax} characters`);
    }
    const row = await ownedTicket(userId, ticketId);
    if (row.status === 'closed') throw new SupportError('This ticket is closed. Reopen it to continue.', 409, 'TICKET_CLOSED');

    await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'user', $2)`, [ticketId, text]);
    await pool.query(`UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = $1`, [ticketId]);
    void this.forwardToInbox(toTicket(row), text, userId, true);
    return this.getTicket(userId, ticketId);
  },

  async setStatus(userId: string, ticketId: string, action: 'close' | 'reopen'): Promise<SupportTicket> {
    const row = await ownedTicket(userId, ticketId);
    if (action === 'close' && row.status !== 'closed') {
      await pool.query(`UPDATE support_tickets SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = $1`, [ticketId]);
      await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'system', 'You closed this ticket.')`, [ticketId]);
    } else if (action === 'reopen' && row.status === 'closed') {
      await pool.query(`UPDATE support_tickets SET status = 'open', closed_at = NULL, updated_at = NOW() WHERE id = $1`, [ticketId]);
      await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'system', 'You reopened this ticket.')`, [ticketId]);
    }
    return this.getTicket(userId, ticketId);
  },

  /** Notify the support inbox. Only the reference, topic and a PII-redacted message leave the system. */
  async forwardToInbox(ticket: SupportTicket, message: string, userId: string, isReply = false): Promise<void> {
    if (!env.RESEND_API_KEY || !env.SUPPORT_INBOX_EMAIL) return;
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const safe = escapeHtml(redactPII(message)).replace(/\n/g, '<br/>');
      const { error } = await resend.emails.send({
        from: `AssetMap Support <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: env.SUPPORT_INBOX_EMAIL,
        subject: `[${ticket.reference}] ${isReply ? 'New reply: ' : ''}${ticket.subject}`.slice(0, 200),
        html: `<p><strong>Ticket:</strong> ${ticket.reference} (${escapeHtml(ticket.category)}, via ${ticket.channel})</p>
               <p><strong>User ID:</strong> ${escapeHtml(userId)}</p><hr/><p>${safe}</p>`,
      });
      if (error) logger.warn('[Support] Inbox email failed', { ticket: ticket.reference, error: error.message });
    } catch (err) {
      logger.warn('[Support] Inbox email failed', { ticket: ticket.reference, error: (err as Error).message });
    }
  },

  /**
   * Optional automated first reply. Sends only the topic and the redacted first message —
   * never account data — and is labelled as automated in the UI.
   */
  async assistantFirstReply(ticket: SupportTicket, message: string): Promise<void> {
    // Read at call time so it can be switched off without a restart (and in tests)
    if ((process.env.SUPPORT_AI_ASSISTANT ?? env.SUPPORT_AI_ASSISTANT) === 'false' || !getClaude()) return;
    try {
      const result = await generateJSON<{ reply: string }>({
        model: CLAUDE_MODELS.fast,
        maxTokens: 600,
        system: SUPPORT_ASSISTANT_SYSTEM,
        schema: {
          type: 'object',
          properties: { reply: { type: 'string' } },
          required: ['reply'],
          additionalProperties: false,
        },
        prompt: `Topic: ${ticket.category}\nSubject: ${redactPII(ticket.subject)}\n\nUser message:\n${redactPII(message).slice(0, 2000)}`,
      });
      const reply = cleanText(result.reply ?? '').slice(0, SUPPORT_LIMITS.messageMax);
      if (!reply) return;
      await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'assistant', $2)`, [ticket.id, reply]);
      await pool.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, [ticket.id]);
    } catch (err) {
      logger.warn('[Support] Assistant reply skipped', { ticket: ticket.reference, error: describeClaudeError(err) });
    }
  },
};

const SUPPORT_ASSISTANT_SYSTEM = `You are the automated help assistant for AssetMap (shown to users as "Codas"), an Indian app that discovers a person's financial and land assets.
Write a short, friendly first reply (under 120 words, plain text, no markdown headings) to a support ticket. A human support agent will follow up within 1 business day — say so.
Facts you may rely on:
- Sign-in: mobile OTP; new users verify identity with Aadhaar OTP (Aadhaar number is never stored, only a salted hash).
- Bank, deposit, mutual fund, equity, NPS, EPF and insurance data comes read-only via the RBI Account Aggregator framework (Setu). Consent can be revoked anytime from the Account Aggregator app.
- Property: Dashboard > Property. Unclaimed money: Dashboard > Unclaimed. Nominee check/update: /nominee. Digital Will: Dashboard > Digital Will. Family Vault: Dashboard > Family Vault (owner invites by mobile number; the invitee accepts in the app; each member controls what they share). Two-factor authentication: Settings > Two-factor. Plans: /pricing; billing: /billing. Paid plans cannot be switched to a lower plan mid-subscription.
Rules: never ask for or repeat Aadhaar, PAN, account numbers, OTPs or passwords; never claim to have looked at the user's account; never promise refunds, timelines other than the 1 business day, or outcomes; if unsure, say the support team will help.`;
