import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock, Lightbulb, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { GUIDES, type Guide, type GuideCategory } from './helpContent';

const CATEGORIES: GuideCategory[] = ['Getting started', 'Your assets', 'Family & legacy', 'Account & security'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGuideId?: string | null;
  onContact: () => void;
}

export default function GuidesDialog({ open, onOpenChange, initialGuideId, onContact }: Props) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(initialGuideId ?? null);

  useEffect(() => { if (open) setSelectedId(initialGuideId ?? null); }, [open, initialGuideId]);

  const guide = GUIDES.find(g => g.id === selectedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[40rem] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <div className="shrink-0 border-b border-border px-5 py-4 pr-14 sm:px-6">
          {guide ? (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-3.5" /> All guides
            </button>
          ) : null}
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-5 shrink-0 text-sky-500" />
            {guide ? guide.title : 'User guides'}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {guide ? guide.summary : 'Step-by-step help for every part of the app.'}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {guide ? (
            <GuideDetail
              guide={guide}
              onOpenFeature={(to) => { onOpenChange(false); navigate(to); }}
              onContact={onContact}
            />
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map(cat => (
                <section key={cat} aria-labelledby={`guide-cat-${cat}`}>
                  <h3 id={`guide-cat-${cat}`} className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
                  <ul className="space-y-2">
                    {GUIDES.filter(g => g.category === cat).map(g => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(g.id)}
                          className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-foreground/20 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">{g.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{g.summary}</span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                            <Clock className="size-3" /> {g.minutes} min
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuideDetail({ guide, onOpenFeature, onContact }: { guide: Guide; onOpenFeature: (to: string) => void; onContact: () => void }) {
  return (
    <div className="space-y-5">
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> {guide.minutes} min read · {guide.category}
      </p>

      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">{i + 1}</span>
            <p className="pt-0.5 text-sm leading-relaxed text-foreground">{step}</p>
          </li>
        ))}
      </ol>

      {guide.tips?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="size-3.5" /> Good to know
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100/90">
            {guide.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onContact}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="size-4" /> Still stuck? Message support
        </button>
        {guide.cta ? (
          <button
            type="button"
            onClick={() => onOpenFeature(guide.cta!.to)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {guide.cta.label} <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
