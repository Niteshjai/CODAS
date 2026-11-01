import { useState, type FormEvent } from 'react'
import { ArrowUp, Info, Loader2, MessageCircleQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { userFacingMessage } from '../errors/ErrorCard'
import { monthLabel } from './format'
import { Panel } from './SpendUi'
import type { AskResult } from './types'

const SUGGESTIONS = [
  'How much did I spend on food delivery?',
  'Which subscriptions am I paying for?',
  'What is my savings rate?',
  'What did I spend the most on?',
]

interface Turn { question: string; result?: AskResult; error?: string }

export function AskSpending({ month }: { month: string }) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)

  const ask = async (q: string) => {
    const text = q.trim()
    if (text.length < 3 || busy) return
    setBusy(true)
    setQuestion('')
    setTurns((t) => [{ question: text }, ...t].slice(0, 5))
    try {
      // The viewed month: questions without a month are answered for it, never for another one
      const res = await api.post('/spend/ask', { question: text.slice(0, 300), month })
      const result = res.data.data as AskResult
      setTurns((t) => t.map((x, i) => (i === 0 ? { ...x, result } : x)))
    } catch (err) {
      setTurns((t) => t.map((x, i) => (i === 0 ? { ...x, error: userFacingMessage(err) } : x)))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); void ask(question) }

  return (
    <Panel
      title={<span className="inline-flex items-center gap-1.5"><MessageCircleQuestion className="size-4" aria-hidden /> Ask about my spending</span>}
      subtitle="Answers come only from your categorised totals, not from guesses."
    >
      <form onSubmit={submit} className="relative">
        <label htmlFor="spend-ask" className="sr-only">Ask a question about your spending</label>
        <input
          id="spend-ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          placeholder={`e.g. How much did I spend on travel in ${monthLabel(month, true)}?`}
          className="w-full rounded-full border border-border bg-card pl-4 pr-12 h-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
        />
        <button
          type="submit"
          aria-label="Ask"
          disabled={busy || question.trim().length < 3}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-foreground text-background disabled:opacity-40 transition"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </form>

      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { void ask(s) }}
              disabled={busy}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted transition text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <ul className="mt-4 space-y-3" aria-live="polite">
          {turns.map((t, i) => (
            <li key={`${t.question}-${turns.length - i}`} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t.question}</p>
              {!t.result && !t.error && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Looking at your numbers…</p>
              )}
              {t.error && <p className="text-sm text-[var(--tone-danger-fg)]">{t.error}</p>}
              {t.result && (
                <div className={cn('rounded-xl px-3.5 py-2.5 text-sm', t.result.answerable ? 'bg-muted text-foreground' : 'border border-dashed border-border text-muted-foreground')}>
                  <p>{t.result.answer}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Info className="size-3" aria-hidden />
                    {t.result.source === 'ai' ? 'Answered by AI from your spending summary' : 'Answered from your spending summary without AI'}
                    {t.result.month ? ` · ${monthLabel(t.result.month)}` : ''}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {turns.length > 0 && !busy && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter((s) => !turns.some((t) => t.question === s)).slice(0, 3).map((s) => (
            <button key={s} type="button" onClick={() => { void ask(s) }}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition">
              {s}
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}
