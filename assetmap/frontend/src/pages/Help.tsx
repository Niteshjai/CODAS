import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronRight, FileText, Inbox, Mail, MessageCircle, Search, X,
} from 'lucide-react';
import GuidesDialog from '../components/help/GuidesDialog';
import FaqDialog from '../components/help/FaqDialog';
import ContactDialog from '../components/help/ContactDialog';
import SupportChatDialog from '../components/help/SupportChatDialog';
import { GUIDES, searchHelp } from '../components/help/helpContent';
import { Highlight, StatusBadge, excerpt, timeAgo } from '../components/help/helpUi';
import { topicLabel } from '../components/help/helpContent';
import { listTickets, type SupportTicket } from '../services/support';
import { ErrorCard } from '../components/errors/ErrorCard';

type Panel =
  | { kind: 'guides'; guideId?: string | null }
  | { kind: 'faqs'; faqId?: string | null; query?: string }
  | { kind: 'contact' }
  | { kind: 'chat'; ticketId: string | null }
  | null;

const POPULAR = ['link-accounts', 'will', 'family-vault', 'two-factor'];

export default function Help() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<Panel>(null);

  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [ticketsError, setTicketsError] = useState<unknown>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try { setTickets(await listTickets()); }
    catch (err) { setTicketsError(err); }
    finally { setTicketsLoading(false); }
  }, []);

  useEffect(() => { void loadTickets(); }, [loadTickets]);

  // "/" focuses the search box (unless typing somewhere already)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !panel && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  const results = useMemo(() => searchHelp(query), [query]);
  const searching = query.trim().length > 0;
  const resultCount = results.guides.length + results.faqs.length;
  const close = () => setPanel(null);
  const openChat = (ticketId: string | null = null) => setPanel({ kind: 'chat', ticketId });

  const cards = [
    { id: 'guides', title: 'User guides', desc: 'Step-by-step help for every feature.', icon: <BookOpen className="size-5 text-sky-500" />, onClick: () => setPanel({ kind: 'guides' }) },
    { id: 'faqs', title: 'FAQs', desc: 'Quick answers about security, data and plans.', icon: <FileText className="size-5 text-emerald-500" />, onClick: () => setPanel({ kind: 'faqs' }) },
    { id: 'chat', title: 'Chat with support', desc: 'Start a conversation — we reply within 1 business day.', icon: <MessageCircle className="size-5 text-amber-500" />, onClick: () => openChat(null) },
    { id: 'contact', title: 'Email support', desc: 'Send a detailed request and get a reference number.', icon: <Mail className="size-5 text-rose-500" />, onClick: () => setPanel({ kind: 'contact' }) },
  ];

  const openTickets = tickets?.filter(t => t.status !== 'closed').length ?? 0;

  return (
    <div className="page-gradient-bg relative min-h-screen pb-20 font-sans text-foreground">
      <header className="sticky top-0 z-20 pt-4">
        <div className="mx-auto flex w-full max-w-[56rem] items-center px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/dashboard'))}
            className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-8 w-full max-w-[56rem] px-4 sm:mt-12 sm:px-6">
        {/* Hero + search */}
        <div className="mb-8 text-center">
          <h1 className="text-balance font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">How can we help?</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">Search the guides and FAQs, or contact our support team.</p>
        </div>

        <div className="relative mx-auto mb-10 w-full">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            role="searchbox"
            aria-label="Search help articles"
            placeholder="Search guides and FAQs — e.g. consent, nominee, will"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
            className="w-full rounded-full border border-border bg-card/90 py-4 pl-12 pr-24 text-sm text-foreground shadow-sm backdrop-blur-lg transition placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">/</kbd>
          )}
        </div>

        {searching ? (
          <section aria-live="polite" aria-label="Search results" className="mb-12">
            <p className="mb-3 text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{query.trim()}”
            </p>
            {resultCount === 0 ? (
              <div className="rounded-3xl border border-border bg-card/80 px-6 py-10 text-center backdrop-blur-sm">
                <Search className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium text-foreground">No articles match your search.</p>
                <p className="mt-1 text-sm text-muted-foreground">Try different words, or ask our team directly.</p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <button type="button" onClick={() => openChat(null)} className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                    <MessageCircle className="size-4" /> Chat with support
                  </button>
                  <button type="button" onClick={() => setPanel({ kind: 'contact' })} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                    <Mail className="size-4" /> Email support
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {results.guides.map(g => (
                  <ResultRow
                    key={`g-${g.id}`}
                    kind="Guide"
                    icon={<BookOpen className="size-4 text-sky-500" />}
                    title={<Highlight text={g.title} query={query} />}
                    snippet={<Highlight text={excerpt([g.summary, ...g.steps].join(' '), query)} query={query} />}
                    onClick={() => setPanel({ kind: 'guides', guideId: g.id })}
                  />
                ))}
                {results.faqs.map(f => (
                  <ResultRow
                    key={`f-${f.id}`}
                    kind="FAQ"
                    icon={<FileText className="size-4 text-emerald-500" />}
                    title={<Highlight text={f.q} query={query} />}
                    snippet={<Highlight text={excerpt(f.a, query)} query={query} />}
                    onClick={() => setPanel({ kind: 'faqs', faqId: f.id })}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            {/* Support options */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={c.onClick}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-card/80 p-6 text-left shadow-sm backdrop-blur-lg transition hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="mb-4 flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-border bg-background shadow-sm transition-transform group-hover:scale-105">{c.icon}</span>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                  <span className="mb-1 font-display text-lg font-semibold text-foreground">{c.title}</span>
                  <span className="text-sm text-muted-foreground">{c.desc}</span>
                </button>
              ))}
            </div>

            {/* Popular guides */}
            <section aria-labelledby="popular-heading" className="mb-12">
              <h2 id="popular-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular guides</h2>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(id => GUIDES.find(g => g.id === id)).filter(Boolean).map(g => (
                  <button
                    key={g!.id}
                    type="button"
                    onClick={() => setPanel({ kind: 'guides', guideId: g!.id })}
                    className="rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm text-foreground backdrop-blur-sm transition hover:border-foreground/20 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {g!.title}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* My tickets */}
        <section aria-labelledby="tickets-heading" className="mb-12">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="tickets-heading" className="font-display text-lg font-semibold text-foreground">
              My tickets
              {openTickets > 0 ? <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">{openTickets} open</span> : null}
            </h2>
            {tickets && tickets.length > 0 ? (
              <button type="button" onClick={() => openChat(null)} className="rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-card">
                New conversation
              </button>
            ) : null}
          </div>

          {ticketsLoading && !tickets ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading tickets">
              {[0, 1].map(i => <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl border border-border bg-card/60" />)}
            </div>
          ) : ticketsError && !tickets ? (
            <ErrorCard error={ticketsError} title="We couldn't load your tickets" onRetry={() => { void loadTickets(); }} compact />
          ) : !tickets || tickets.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
              <Inbox className="size-7 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No support tickets yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Conversations you start with our team will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openChat(t.id)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3.5 text-left backdrop-blur-sm transition hover:border-foreground/15 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{t.subject}</span>
                        <StatusBadge status={t.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        <span className="font-mono">{t.reference}</span> · {topicLabel(t.category)} · {t.channel === 'email' ? 'Email' : 'Chat'} · updated {timeAgo(t.updatedAt)}
                      </span>
                      {t.lastMessage ? (
                        <span className="mt-1 block truncate text-xs text-muted-foreground/90">
                          {t.lastMessage.sender === 'user' ? 'You: ' : t.lastMessage.sender === 'assistant' ? 'Assistant: ' : 'Support: '}
                          {t.lastMessage.preview}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Still need help */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center text-white shadow-xl sm:p-10">
          <div className="relative z-10">
            <h2 className="mb-2 font-display text-2xl font-semibold">Still need help?</h2>
            <p className="mx-auto mb-6 max-w-[28rem] text-sm text-white/70">
              Send us a message and our support team will get back to you within 1 business day.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPanel({ kind: 'contact' })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-lime-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200 sm:w-auto"
              >
                <Mail className="size-4" /> Contact support
              </button>
              <button
                type="button"
                onClick={() => openChat(null)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
              >
                <MessageCircle className="size-4" /> Start a conversation
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-lime-400/10 blur-3xl" />
        </section>
      </main>

      <GuidesDialog
        open={panel?.kind === 'guides'}
        onOpenChange={(o) => { if (!o) close(); }}
        initialGuideId={panel?.kind === 'guides' ? panel.guideId : null}
        onContact={() => openChat(null)}
      />
      <FaqDialog
        open={panel?.kind === 'faqs'}
        onOpenChange={(o) => { if (!o) close(); }}
        initialFaqId={panel?.kind === 'faqs' ? panel.faqId : null}
        onContact={() => openChat(null)}
      />
      <ContactDialog
        open={panel?.kind === 'contact'}
        onOpenChange={(o) => { if (!o) close(); }}
        onCreated={() => { void loadTickets(); }}
        onViewTicket={(id) => openChat(id)}
      />
      <SupportChatDialog
        open={panel?.kind === 'chat'}
        onOpenChange={(o) => { if (!o) close(); }}
        ticketId={panel?.kind === 'chat' ? panel.ticketId : null}
        onTicketOpened={(id) => setPanel({ kind: 'chat', ticketId: id })}
        onChanged={() => { void loadTickets(); }}
      />
    </div>
  );
}

function ResultRow({ kind, icon, title, snippet, onClick }: {
  kind: string; icon: React.ReactNode; title: React.ReactNode; snippet: React.ReactNode; onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3.5 text-left backdrop-blur-sm transition hover:border-foreground/15 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{kind}</span>
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{snippet}</span>
        </span>
        <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
      </button>
    </li>
  );
}
