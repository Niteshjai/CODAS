import { useState } from 'react';
import { Target, Plus, Loader2, Trash2, PartyPopper, CalendarDays, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFamilyStore, type Goal } from '../../store/familyStore';
import { GOAL_TYPE_OPTIONS, cardClass, formatDate, goalTypeLabel, inputClass, rupees, rupeesCompact, selectClass, timeAgo } from './familyUi';

const toPaise = (rupeesText: string) => Math.round(Number(rupeesText.replace(/,/g, '')) * 100);

function monthsUntil(iso: string): number {
  const d = new Date(iso), now = new Date();
  return Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
}

function NewGoalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createGoal = useFamilyStore((s) => s.createGoal);
  const [form, setForm] = useState({ name: '', goalType: '', target: '', targetDate: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = form.name.trim();
    const target = toPaise(form.target);
    if (name.length < 2) next.name = 'Give the goal a name';
    if (!form.goalType) next.goalType = 'Choose a type';
    if (!Number.isFinite(target) || target < 100_00) next.target = 'Enter at least ₹100';
    if (form.targetDate && form.targetDate <= today) next.targetDate = 'Pick a future date';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await createGoal({
        name,
        goalType: form.goalType,
        emoji: GOAL_TYPE_OPTIONS.find(g => g.value === form.goalType)?.emoji,
        targetAmountPaise: target,
        targetDate: form.targetDate || null,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      toast.success('Goal created — your family can see it now');
      setForm({ name: '', goalType: '', target: '', targetDate: '', description: '' });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[28rem] max-h-[90dvh] overflow-y-auto rounded-2xl border-border bg-card p-0 gap-0">
        <DialogHeader className="border-b border-border p-6 pr-14 text-left">
          <DialogTitle className="text-base font-semibold text-foreground">New family goal</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Everyone in the vault can track progress and add money.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-type">Goal type</Label>
            <select id="goal-type" value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value })} className={selectClass} aria-invalid={!!errors.goalType}>
              <option value="">Select a type</option>
              {GOAL_TYPE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.emoji}  {g.label}</option>)}
            </select>
            {errors.goalType && <p className="text-xs text-destructive">{errors.goalType}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <input id="goal-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Aarav's college fund" aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target amount (₹)</Label>
              <input id="goal-target" inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value.replace(/[^0-9.,]/g, '') })} className={inputClass} placeholder="5,00,000" aria-invalid={!!errors.target} />
              {errors.target && <p className="text-xs text-destructive">{errors.target}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-date">Target date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <input id="goal-date" type="date" min={today} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className={inputClass} aria-invalid={!!errors.targetDate} />
              {errors.targetDate && <p className="text-xs text-destructive">{errors.targetDate}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <textarea id="goal-desc" maxLength={500} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-auto py-2 resize-none`} placeholder="What it's for" />
          </div>
          <div className="pt-2 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="h-10 rounded-xl" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : 'Create goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { contribute, cancelGoal } = useFamilyStore();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const done = goal.status === 'completed';

  const monthlyNeeded = !done && goal.targetDate && goal.remainingPaise > 0
    ? goal.remainingPaise / monthsUntil(goal.targetDate) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paise = toPaise(amount);
    if (!Number.isFinite(paise) || paise < 100) { setAmountError('Enter at least ₹1'); return; }
    setAmountError('');
    setSaving(true);
    try {
      const res = await contribute(goal.id, paise, note.trim() || undefined);
      toast.success(res.completed ? `🎉 ${goal.name} reached its target!` : `${rupees(paise)} added to ${goal.name}`);
      setAmount(''); setNote(''); setAdding(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await cancelGoal(goal.id);
      toast.success('Goal removed');
      setConfirmRemove(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <li className={`rounded-xl border p-4 transition-colors ${done ? 'border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border bg-muted/30'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{goal.emoji || '🎯'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">{goal.name}</h4>
              <p className="text-[11px] text-muted-foreground">{goalTypeLabel(goal.goalType)} · by {goal.createdBy}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm text-foreground tabular-nums">{rupeesCompact(goal.currentAmountPaise)}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">of {rupeesCompact(goal.targetAmountPaise)}</p>
            </div>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={goal.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
            <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-gradient-to-r from-lime-400 to-emerald-500'}`} style={{ width: `${goal.progressPct}%` }} />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
            <span className={`font-semibold ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-lime-700 dark:text-lime-400'}`}>
              {done ? <span className="inline-flex items-center gap-1"><PartyPopper className="size-3" />Goal reached</span> : `${goal.progressPct}% · ${rupeesCompact(goal.remainingPaise)} to go`}
            </span>
            {goal.targetDate && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3" />
                {formatDate(goal.targetDate)}
                {monthlyNeeded ? ` · ~${rupeesCompact(monthlyNeeded)}/month` : ''}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!done && !adding && (
              <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background hover:opacity-90">
                <Plus className="size-3" /> Add money
              </button>
            )}
            {goal.contributionCount > 0 && (
              <button type="button" onClick={() => setShowHistory(v => !v)} aria-expanded={showHistory} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                {goal.contributionCount} contribution{goal.contributionCount === 1 ? '' : 's'}
                <ChevronDown className={`size-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
            )}
            {goal.canCancel && (
              <button type="button" onClick={() => setConfirmRemove(true)} className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove goal ${goal.name}`}>
                <Trash2 className="size-3" /> Remove
              </button>
            )}
          </div>

          {adding && (
            <form onSubmit={submit} noValidate className="mt-3 rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-2">
                <div>
                  <label htmlFor={`amt-${goal.id}`} className="sr-only">Amount in rupees</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-input bg-muted text-xs text-muted-foreground">₹</span>
                    <input id={`amt-${goal.id}`} autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Amount" className={`${inputClass} h-9 rounded-l-none`} aria-invalid={!!amountError} />
                  </div>
                </div>
                <div>
                  <label htmlFor={`note-${goal.id}`} className="sr-only">Note</label>
                  <input id={`note-${goal.id}`} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={`${inputClass} h-9`} />
                </div>
              </div>
              {amountError && <p className="text-xs text-destructive">{amountError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => { setAdding(false); setAmountError(''); }}>Cancel</Button>
                <Button type="submit" size="sm" className="h-8 rounded-lg" disabled={saving}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </form>
          )}

          {showHistory && (
            <ul className="mt-3 space-y-1.5 border-l-2 border-border pl-3">
              {goal.contributions.map((c, i) => (
                <li key={i} className="text-[11px]">
                  <span className="font-semibold text-foreground tabular-nums">{rupees(c.amountPaise)}</span>
                  <span className="text-muted-foreground"> · {c.isYou ? 'You' : c.by} · {timeAgo(c.at)}</span>
                  {c.note && <span className="block text-muted-foreground italic truncate">“{c.note}”</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={(o) => { if (!removing) setConfirmRemove(o); }}>
        <AlertDialogContent className="max-w-[26rem] rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{goal.name}"?</AlertDialogTitle>
            <AlertDialogDescription>The goal and its progress will be hidden for the whole family. Money already saved is not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Keep goal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void remove(); }} disabled={removing} className="bg-destructive text-white hover:bg-destructive/90">
              {removing ? <Loader2 className="size-4 animate-spin" /> : null} Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

export default function FamilyGoals() {
  const { goals, detailsLoading } = useFamilyStore();
  const [creating, setCreating] = useState(false);
  const active = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');

  return (
    <section className={`${cardClass} p-6 h-full`} aria-labelledby="family-goals-title">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 id="family-goals-title" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="size-4" />
          Shared goals
          {active.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">{active.length}</span>}
        </h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" />
          New goal
        </button>
      </div>

      {goals.length === 0 ? (
        detailsLoading ? (
          <div className="space-y-3">{[0, 1].map(i => <div key={i} className="h-24 rounded-xl bg-muted/60 animate-pulse" />)}</div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 flex flex-col items-center text-center">
            <div className="size-10 rounded-full bg-lime-100 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400 grid place-items-center">
              <Target className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Save for something together</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[22rem] text-balance">
              A vacation, a home down payment, a child's education — set a target and everyone can add to it.
            </p>
            <button type="button" onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90">
              <Plus className="size-3.5" /> Create the first goal
            </button>
          </div>
        )
      ) : (
        <ul className="space-y-3">
          {active.map(g => <GoalCard key={g.id} goal={g} />)}
          {completed.length > 0 && (
            <>
              <li className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground list-none">Completed</li>
              {completed.map(g => <GoalCard key={g.id} goal={g} />)}
            </>
          )}
        </ul>
      )}

      <NewGoalDialog open={creating} onOpenChange={setCreating} />
    </section>
  );
}
