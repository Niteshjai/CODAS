import { useState } from 'react';
import { UserPlus, Loader2, Users, CheckCircle2, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFamilyStore, type Vault } from '../../store/familyStore';
import { RELATIONSHIP_OPTIONS, inputClass, selectClass } from './familyUi';

interface Props {
  vault: Vault | null;
  /** Custom trigger (e.g. the sidebar "Add Member" link); defaults to the primary button */
  trigger?: React.ReactNode;
  className?: string;
}

const emptyForm = { name: '', mobile: '', relationship: '' };

export default function InviteMember({ vault, trigger, className }: Props) {
  const inviteMember = useFamilyStore((s) => s.inviteMember);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ name: string; smsSent: boolean; mobileHint: string } | null>(null);

  if (!vault?.viewer?.isOwner) return null;

  const seatsLeft = Math.max(0, vault.max_members - vault.seatsUsed);
  const isFull = seatsLeft === 0;

  const openDialog = () => {
    if (isFull) {
      toast.error(`Your vault is full (${vault.max_members} members). Remove a member or cancel an invite first.`);
      return;
    }
    setForm(emptyForm);
    setErrors({});
    setSent(null);
    setOpen(true);
  };

  const validate = () => {
    const next: typeof errors = {};
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (name.length < 2) next.name = 'Enter their name';
    else if (!/^[\p{L} .'-]+$/u.test(name)) next.name = 'Use letters only';
    if (!/^[6-9][0-9]{9}$/.test(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.relationship) next.relationship = 'Choose how they are related to you';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const name = form.name.trim().replace(/\s+/g, ' ');
      const res = await inviteMember(form.mobile, name, form.relationship);
      setSent({ name, smsSent: !!res?.smsSent, mobileHint: res?.mobileHint ?? `••••${form.mobile.slice(-4)}` });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={isFull}
          onClick={(e) => { e.stopPropagation(); openDialog(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDialog(); } }}
          className={`w-full ${isFull ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {trigger}
        </div>
      ) : (
        <Button
          onClick={openDialog}
          disabled={isFull}
          title={isFull ? 'Vault is full' : undefined}
          className={`h-10 rounded-full px-5 gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 ${className ?? ''}`}
        >
          <UserPlus className="size-4" />
          Invite member
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[28rem] rounded-2xl border-border bg-card p-0 gap-0 overflow-hidden">
          {sent ? (
            <div className="p-6 sm:p-7 text-center">
              <div className="mx-auto mb-4 size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                <CheckCircle2 className="size-6" />
              </div>
              <DialogTitle className="text-lg font-semibold text-foreground">Invitation ready for {sent.name}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground text-balance">
                {sent.smsSent
                  ? <>We've sent a joining link by SMS to <span className="font-medium text-foreground">+91 {sent.mobileHint}</span>.</>
                  : <>Ask {sent.name.split(' ')[0]} to sign in to AssetMap with <span className="font-medium text-foreground">+91 {sent.mobileHint}</span>.</>}
              </DialogDescription>

              <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-left space-y-3">
                <div className="flex gap-3">
                  <Smartphone className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    The invitation appears under <span className="font-medium text-foreground">Family Vault</span> once they sign in with that number. It expires in 7 days and you can resend it from their card.
                  </p>
                </div>
                <div className="flex gap-3">
                  <MessageSquare className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">They don't need a Pro plan, and they decide which of their assets the family can see.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={vault.max_members - vault.seatsUsed <= 0}
                  onClick={() => { setForm(emptyForm); setErrors({}); setSent(null); }}
                >
                  Invite another
                </Button>
                <Button className="h-10 rounded-xl" onClick={() => setOpen(false)}>Done</Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-6 pr-14 text-left">
                <div className="size-10 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400 grid place-items-center shrink-0">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-foreground">Invite a family member</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {seatsLeft} of {vault.max_members} seats left in {vault.vault_name}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name">Their name</Label>
                  <input
                    id="invite-name"
                    autoFocus
                    autoComplete="off"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Priya Sharma"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'invite-name-err' : undefined}
                  />
                  {errors.name && <p id="invite-name-err" className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-mobile">Mobile number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm font-medium text-muted-foreground">+91</span>
                    <input
                      id="invite-mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '').slice(0, 10) })}
                      className={`${inputClass} rounded-l-none`}
                      placeholder="98765 43210"
                      aria-invalid={!!errors.mobile}
                      aria-describedby="invite-mobile-hint"
                    />
                  </div>
                  {errors.mobile
                    ? <p id="invite-mobile-hint" className="text-xs text-destructive">{errors.mobile}</p>
                    : <p id="invite-mobile-hint" className="text-xs text-muted-foreground">They must sign in to AssetMap with this number to accept.</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-relationship">Relationship to you</Label>
                  <select
                    id="invite-relationship"
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className={selectClass}
                    aria-invalid={!!errors.relationship}
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {errors.relationship && <p className="text-xs text-destructive">{errors.relationship}</p>}
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="h-10 rounded-xl" disabled={submitting}>
                    {submitting ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : 'Send invitation'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
