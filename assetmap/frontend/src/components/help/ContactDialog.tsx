import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createTicket, SUPPORT_LIMITS, type SupportTicket } from '../../services/support';
import { SUPPORT_EMAIL, SUPPORT_TOPICS } from './helpContent';
import { fieldClass } from './helpUi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTopic?: string;
  onCreated: (ticket: SupportTicket) => void;
  onViewTicket: (ticketId: string) => void;
}

type Errors = Partial<Record<'topic' | 'subject' | 'message', string>>;

export default function ContactDialog({ open, onOpenChange, defaultTopic = '', onCreated, onViewTicket }: Props) {
  const [topic, setTopic] = useState(defaultTopic);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (open) { setCreated(null); setErrors({}); setFormError(''); setTopic(t => t || defaultTopic); }
  }, [open, defaultTopic]);

  const reset = () => { setTopic(''); setSubject(''); setMessage(''); setErrors({}); setFormError(''); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = subject.trim();
    const m = message.trim();
    const next: Errors = {};
    if (!topic) next.topic = 'Choose what this is about.';
    if (s.length < SUPPORT_LIMITS.subjectMin) next.subject = 'Add a short subject (at least 3 characters).';
    if (m.length < 10) next.message = 'Describe the issue in a little more detail (at least 10 characters).';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      const ticket = await createTicket({ category: topic, subject: s, message: m, channel: 'email' });
      setCreated(ticket);
      onCreated(ticket);
      reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'We couldn\'t send your message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim() || 'Support request')}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!sending) onOpenChange(o); }}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[32rem] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <div className="shrink-0 border-b border-border px-5 py-4 pr-14 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 shrink-0 text-rose-500" /> Email support
          </DialogTitle>
          <DialogDescription className="mt-1">
            We reply within 1 business day. Don&apos;t include Aadhaar, account numbers, OTPs or passwords.
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {created ? (
            <div className="py-4 text-center" role="status">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">Message sent</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your reference number is</p>
              <button
                type="button"
                onClick={() => { void navigator.clipboard?.writeText(created.reference).then(() => toast.success('Reference copied')); }}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 font-mono text-base font-semibold text-foreground transition hover:bg-muted/70"
                aria-label={`Copy reference ${created.reference}`}
              >
                {created.reference} <Copy className="size-3.5 text-muted-foreground" />
              </button>
              <p className="mx-auto mt-4 max-w-[22rem] text-sm text-muted-foreground">
                Our team will reply within 1 business day. You&apos;ll find the reply under <span className="font-medium text-foreground">My tickets</span> on this page.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                  Done
                </button>
                <button type="button" onClick={() => onViewTicket(created.id)} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                  View ticket
                </button>
              </div>
            </div>
          ) : (
            <form id="contact-form" onSubmit={submit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-topic" className="text-sm font-medium text-foreground">Topic</label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={sending}
                  aria-invalid={!!errors.topic}
                  className={fieldClass}
                >
                  <option value="">Choose a topic</option>
                  {SUPPORT_TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {errors.topic ? <p className="text-xs text-destructive">{errors.topic}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="text-sm font-medium text-foreground">Subject</label>
                <input
                  id="contact-subject"
                  value={subject}
                  maxLength={SUPPORT_LIMITS.subjectMax}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                  placeholder="e.g. My bank account isn't showing"
                  aria-invalid={!!errors.subject}
                  className={fieldClass}
                />
                {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="contact-message" className="text-sm font-medium text-foreground">Message</label>
                  <span className="text-[11px] text-muted-foreground">{message.length}/{SUPPORT_LIMITS.messageMax}</span>
                </div>
                <textarea
                  id="contact-message"
                  rows={6}
                  value={message}
                  maxLength={SUPPORT_LIMITS.messageMax}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  placeholder="What happened, what you expected, and the steps to reproduce it."
                  aria-invalid={!!errors.message}
                  className={`${fieldClass} resize-y`}
                />
                {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
              </div>

              {formError ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
            </form>
          )}
        </div>

        {!created ? (
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <a href={mailto} className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-left">
              Prefer your email app? Write to {SUPPORT_EMAIL}
            </a>
            <button
              type="submit"
              form="contact-form"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {sending ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : 'Send message'}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
