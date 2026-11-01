import { useEffect, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../../services/api';
import { settingsErrorMessage } from './settingsUi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_COOLDOWN_S = 30;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasEmail: boolean;
  onSaved: () => void;
}

/** Add or change the account email: send a code to the new address, then confirm it. */
export default function EmailDialog({ open, onOpenChange, hasEmail, onSaved }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep('email'); setEmail(''); setCode(''); setError(''); setBusy(false); setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) { setError('Enter a valid email address.'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('/settings/email/start', { email: clean });
      setSentTo(res.data?.data?.maskedEmail ?? clean);
      setStep('code'); setCode(''); setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(settingsErrorMessage(err, "We couldn't send the code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!/^[0-9]{6}$/.test(code)) { setError('Enter the 6-digit code from the email.'); return; }
    setBusy(true); setError('');
    try {
      await api.post('/settings/email/confirm', { otp: code });
      toast.success(hasEmail ? 'Email address updated' : 'Email address added');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(settingsErrorMessage(err, "We couldn't verify the code. Please try again."));
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[28rem] rounded-3xl">
        <DialogHeader>
          <div className="size-11 rounded-2xl bg-muted grid place-items-center mb-1"><Mail className="size-5" aria-hidden /></div>
          <DialogTitle>{hasEmail ? 'Change email address' : 'Add an email address'}</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? "We'll send a 6-digit code to confirm it's yours. Used for email alerts and account notices."
              : <>Enter the code we sent to <span className="font-medium text-foreground">{sentTo}</span>. It expires in 10 minutes.</>}
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => { e.preventDefault(); void (step === 'email' ? sendCode() : confirm()); }}
          className="space-y-4"
        >
          {step === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email address</Label>
              <Input
                id="settings-email" type="email" inputMode="email" autoComplete="email" autoFocus
                value={email} maxLength={254} placeholder="you@example.com"
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                aria-invalid={!!error}
                className="h-11 rounded-xl"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="settings-email-code">Verification code</Label>
              <Input
                id="settings-email-code" inputMode="numeric" autoComplete="one-time-code" autoFocus
                value={code} maxLength={6} placeholder="••••••"
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                aria-invalid={!!error}
                className="h-12 rounded-xl text-center text-xl tracking-[0.5em] font-semibold tabular-nums"
              />
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  onClick={() => { setStep('email'); setError(''); }}>
                  Use a different email
                </button>
                <button type="button" disabled={cooldown > 0 || busy}
                  className="font-medium text-foreground disabled:text-muted-foreground hover:underline underline-offset-4 disabled:no-underline"
                  onClick={() => void sendCode()}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {step === 'email' ? 'Send code' : 'Verify & save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
