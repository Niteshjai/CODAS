import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { supportService, SupportError, redactPII, cleanText, SUPPORT_LIMITS } from '../../src/services/supportService';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

async function expectSupportError(fn: () => Promise<unknown>, status: number, messagePart: string) {
  let caught: unknown;
  try { await fn(); } catch (err) { caught = err; }
  expect(caught instanceof SupportError).toBe(true);
  expect((caught as SupportError).statusCode).toBe(status);
  expect((caught as SupportError).message).toContain(messagePart);
}

export function registerSupportServiceTests() {
  describe('supportService (Help & Support tickets)', () => {
    let userId: string;
    let otherUserId: string;
    let ticketId: string;
    const prevAi = process.env.SUPPORT_AI_ASSISTANT;

    beforeAll(async () => {
      process.env.SUPPORT_AI_ASSISTANT = 'false';
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, 'Support User'), ($2, 'Other User') RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), crypto.randomBytes(16).toString('hex')]);
      userId = res.rows[0].id;
      otherUserId = res.rows[1].id;
    });

    afterAll(async () => {
      process.env.SUPPORT_AI_ASSISTANT = prevAi;
      for (const id of [userId, otherUserId].filter(Boolean)) {
        await pool.query('DELETE FROM support_tickets WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
      }
    });

    it('redacts Aadhaar, PAN, phone, email and account numbers before data leaves the system', async () => {
      const out = redactPII('Aadhaar 1234 5678 9012, PAN ABCDE1234F, call +91 98765 43210, mail a.b@x.in, a/c 001234567890');
      expect(out).not.toContain('9012');
      expect(out).not.toContain('ABCDE1234F');
      expect(out).not.toContain('43210');
      expect(out).not.toContain('a.b@x.in');
      expect(out).not.toContain('001234567890');
      expect(out).toContain('[PAN]');
    });

    it('strips control characters and collapses blank lines', async () => {
      expect(cleanText('  hi\u0007 there\r\n\n\n\nbye  ')).toBe('hi there\n\nbye');
    });

    it('creates a ticket with a reference, the user message and a system note', async () => {
      const t = await supportService.createTicket(userId, {
        category: 'will', subject: 'PDF download', message: 'The will PDF does not download', channel: 'chat',
      });
      ticketId = t.id;
      expect(/^CS-[2-9A-Z]{6}$/.test(t.reference)).toBe(true);
      expect(t.status).toBe('open');
      expect(t.messages!.length).toBe(2);
      expect(t.messages![0].sender).toBe('user');
      expect(t.messages![1].sender).toBe('system');
    });

    it('rejects invalid input', async () => {
      await expectSupportError(() => supportService.createTicket(userId, {
        category: 'nope' as any, subject: 'Valid subject', message: 'hello', channel: 'chat',
      }), 400, 'topic');
      await expectSupportError(() => supportService.createTicket(userId, {
        category: 'other', subject: 'x', message: 'hello', channel: 'chat',
      }), 400, 'Subject');
      await expectSupportError(() => supportService.addMessage(userId, ticketId, 'x'.repeat(SUPPORT_LIMITS.messageMax + 1)), 400, 'Message');
    });

    it("never exposes another user's ticket", async () => {
      await expectSupportError(() => supportService.getTicket(otherUserId, ticketId), 404, 'not found');
      await expectSupportError(() => supportService.addMessage(otherUserId, ticketId, 'hi'), 404, 'not found');
      await expectSupportError(() => supportService.setStatus(otherUserId, ticketId, 'close'), 404, 'not found');
      const others = await supportService.listTickets(otherUserId);
      expect(others.length).toBe(0);
    });

    it('adds replies, lists with a preview, and blocks replies once closed until reopened', async () => {
      const t = await supportService.addMessage(userId, ticketId, 'Still failing on Chrome');
      expect(t.messages!.filter(m => m.sender === 'user').length).toBe(2);

      const list = await supportService.listTickets(userId);
      expect(list.length).toBe(1);
      expect(list[0].lastMessage!.preview).toBe('Still failing on Chrome');

      const closed = await supportService.setStatus(userId, ticketId, 'close');
      expect(closed.status).toBe('closed');
      await expectSupportError(() => supportService.addMessage(userId, ticketId, 'hello?'), 409, 'closed');

      const reopened = await supportService.setStatus(userId, ticketId, 'reopen');
      expect(reopened.status).toBe('open');
    });

    it('caps the number of open tickets', async () => {
      for (let i = 1; i < SUPPORT_LIMITS.maxOpenTickets; i++) {
        await supportService.createTicket(userId, { category: 'other', subject: `Question ${i}`, message: 'help please', channel: 'email' });
      }
      await expectSupportError(() => supportService.createTicket(userId, {
        category: 'other', subject: 'One too many', message: 'help please', channel: 'email',
      }), 409, 'open tickets');
    });
  });
}
