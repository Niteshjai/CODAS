import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Info, Loader2, MessageCircle, RotateCcw, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  createTicket, getTicket, sendMessage, setTicketStatus, SUPPORT_LIMITS,
  type SupportMessage, type SupportTicket,
} from '../../services/support';
import { SUPPORT_TOPICS, topicLabel } from './helpContent';
import { StatusBadge, fieldClass, timeAgo } from './helpUi';

const POLL_MS = 5000;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;              // null → start a new conversation
  onTicketOpened: (ticketId: string) => void;
  onChanged: () => void;                // refresh "My tickets"
}

export default function SupportChatDialog({ open, onOpenChange, ticketId, onTicketOpened, onChanged }: Props) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async (id: string, quiet = false) => {
    if (!quiet) { setLoading(true); setLoadError(''); }
    try {
      setTicket(await getTicket(id));
    } catch (err) {
      if (!quiet) setLoadError(err instanceof Error ? err.message : 'Couldn\'t load this conversation.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setTicket(null);
    if (ticketId) void load(ticketId);
  }, [open, ticketId, load]);

  // Pick up replies (support team or the automated assistant) while the thread is open
  useEffect(() => {
    if (!open || !ticket || ticket.status === 'closed') return;
    const id = ticket.id;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(id, true);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [open, ticket?.id, ticket?.status, load]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(42rem,90dvh)] w-[calc(100vw-2rem)] max-w-[34rem] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        {ticketId && !ticket ? (
          <>
            <ChatHeader title="Support conversation" />
            <div className="grid flex-1 place-items-center p-6 text-center">
              {loading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading conversation" />
              ) : (
                <div>
                  <p className="text-sm text-foreground">{loadError || 'Couldn\'t load this conversation.'}</p>
                  <button type="button" onClick={() => ticketId && void load(ticketId)} className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                    Try again
                  </button>
                </div>
              )}
            </div>
          </>
        ) : ticket ? (
          <Thread ticket={ticket} onUpdate={(t) => { setTicket(t); onChanged(); }} />
        ) : (
          <StartConversation
            onStarted={(t) => { setTicket(t); onTicketOpened(t.id); onChanged(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChatHeader({ title, ticket, action }: { title: string; ticket?: SupportTicket; action?: React.ReactNode }) {
  return (
    <div className="shrink-0 border-b border-border px-5 py-4 pr-14">
      <DialogTitle className="flex items-center gap-2 text-base font-semibold">
        <MessageCircle className="size-5 shrink-0 text-amber-500" />
        <span className="truncate">{title}</span>
      </DialogTitle>
      <DialogDescription asChild>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {ticket ? (
            <>
              <span className="font-mono">{ticket.reference}</span>
              <span aria-hidden>·</span>
              <span>{topicLabel(ticket.category)}</span>
              <StatusBadge status={ticket.status} />
              {action ? <span className="ml-auto">{action}</span> : null}
            </>
          ) : (
            <span>Our support team replies within 1 business day.</span>
          )}
        </div>
      </DialogDescription>
    </div>
  );
}

function StartConversation({ onStarted }: { onStarted: (t: SupportTicket) => void }) {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const m = message.trim();
    if (!topic) return setError('Choose what you need help with.');
    if (m.length < 10) return setError('Tell us a little more (at least 10 characters).');
    setError('');
    setSending(true);
    try {
      // Subject = first line of the message, trimmed to a readable length
      const firstLine = m.split('\n')[0].replace(/\s+/g, ' ');
      const subject = firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine.padEnd(SUPPORT_LIMITS.subjectMin, '.');
      onStarted(await createTicket({ category: topic, subject, message: m, channel: 'chat' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn\'t start the conversation. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <ChatHeader title="Chat with support" />
      <form onSubmit={start} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="flex gap-2.5 rounded-xl border border-border bg-muted/50 p-3.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              This isn&apos;t a live chat. Send your question and our team will reply here within 1 business day —
              you&apos;ll also find the conversation under <span className="font-medium text-foreground">My tickets</span>.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="chat-topic" className="text-sm font-medium text-foreground">What do you need help with?</label>
            <select id="chat-topic" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={sending} className={fieldClass}>
              <option value="">Choose a topic</option>
              {SUPPORT_TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="chat-first-message" className="text-sm font-medium text-foreground">Your message</label>
            <textarea
              id="chat-first-message"
              rows={6}
              value={message}
              maxLength={SUPPORT_LIMITS.messageMax}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              placeholder="Describe your question. Please don't share Aadhaar, account numbers, OTPs or passwords."
              className={`${fieldClass} resize-none`}
            />
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="shrink-0 border-t border-border px-5 py-4">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {sending ? <><Loader2 className="size-4 animate-spin" /> Starting…</> : <><Send className="size-4" /> Start conversation</>}
          </button>
        </div>
      </form>
    </>
  );
}

function Thread({ ticket, onUpdate }: { ticket: SupportTicket; onUpdate: (t: SupportTicket) => void }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messages = ticket.messages ?? [];
  const closed = ticket.status === 'closed';

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      onUpdate(await sendMessage(ticket.id, body));
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message not sent. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function toggle(action: 'close' | 'reopen') {
    setBusy(true);
    setError('');
    try { onUpdate(await setTicketStatus(ticket.id, action)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return (
    <>
      <ChatHeader
        title={ticket.subject}
        ticket={ticket}
        action={
          <button
            type="button"
            onClick={() => toggle(closed ? 'reopen' : 'close')}
            disabled={busy}
            className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {closed ? 'Reopen' : 'Mark resolved'}
          </button>
        }
      />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-4" aria-live="polite">
        {messages.map(m => <Bubble key={m.id} message={m} />)}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        {error ? <p role="alert" className="mb-2 text-xs text-destructive">{error}</p> : null}
        {closed ? (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>This ticket is closed.</span>
            <button type="button" onClick={() => toggle('reopen')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
              <RotateCcw className="size-3.5" /> Reopen to reply
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-end gap-2">
            <label htmlFor="chat-reply" className="sr-only">Reply</label>
            <textarea
              id="chat-reply"
              rows={1}
              value={draft}
              maxLength={SUPPORT_LIMITS.messageMax}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); }
              }}
              disabled={sending}
              placeholder="Write a reply… (Shift+Enter for a new line)"
              className={`${fieldClass} max-h-32 min-h-[2.75rem] resize-none rounded-2xl`}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send reply"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-lime-400 text-zinc-900 transition hover:bg-lime-300 active:scale-95 disabled:opacity-40"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function Bubble({ message }: { message: SupportMessage }) {
  if (message.sender === 'system') {
    return <p className="mx-auto max-w-[90%] text-center text-[11px] leading-relaxed text-muted-foreground">{message.body}</p>;
  }
  const mine = message.sender === 'user';
  const label = mine ? 'You' : message.sender === 'assistant' ? 'Automated assistant' : 'Support team';
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="mb-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
        {message.sender === 'assistant' ? <Bot className="size-3" /> : null}
        {label} · {timeAgo(message.createdAt)}
      </span>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          mine
            ? 'rounded-br-md bg-foreground text-background'
            : message.sender === 'assistant'
              ? 'rounded-bl-md border border-dashed border-border bg-card text-foreground'
              : 'rounded-bl-md border border-border bg-card text-foreground shadow-sm'
        }`}
      >
        {message.body}
      </div>
      {message.sender === 'assistant' ? (
        <span className="mt-1 px-1 text-[10px] text-muted-foreground">Automated reply — a person from our team will follow up.</span>
      ) : null}
    </div>
  );
}
