import { useEffect, useMemo, useState } from 'react';
import { FileText, MessageCircle, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQS, type Faq } from './helpContent';
import { Highlight, fieldClass } from './helpUi';

const TOPICS: Faq['topic'][] = ['Security & privacy', 'Data & consent', 'Features', 'Plans & billing'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFaqId?: string | null;
  initialQuery?: string;
  onContact: () => void;
}

export default function FaqDialog({ open, onOpenChange, initialFaqId, initialQuery = '', onContact }: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setQuery(initialFaqId ? '' : initialQuery);
    setExpanded(initialFaqId ?? '');
  }, [open, initialFaqId, initialQuery]);

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return FAQS;
    return FAQS.filter(f => {
      const text = `${f.q} ${f.a} ${f.topic}`.toLowerCase();
      return words.every(w => text.includes(w));
    });
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[40rem] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <div className="shrink-0 space-y-3 border-b border-border px-5 py-4 pr-14 sm:px-6">
          <div>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="size-5 shrink-0 text-emerald-500" /> Frequently asked questions
            </DialogTitle>
            <DialogDescription className="mt-1">Quick answers about security, your data and features.</DialogDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter questions…"
              aria-label="Filter questions"
              className={`${fieldClass} pl-9 pr-9`}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-6">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">No questions match “{query}”.</p>
              <button
                type="button"
                onClick={onContact}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageCircle className="size-4" /> Ask our support team
              </button>
            </div>
          ) : (
            <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
              {TOPICS.map(topic => {
                const items = filtered.filter(f => f.topic === topic);
                if (!items.length) return null;
                return (
                  <section key={topic} className="pt-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{topic}</h3>
                    {items.map(f => (
                      <AccordionItem key={f.id} value={f.id} className="border-border">
                        <AccordionTrigger className="gap-3 text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
                          <span><Highlight text={f.q} query={query} /></span>
                        </AccordionTrigger>
                        <AccordionContent className="leading-relaxed text-muted-foreground">
                          <Highlight text={f.a} query={query} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </section>
                );
              })}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
