import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldAlert, Smartphone, Mail, Loader2, X, Power } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { CardSkeleton } from '../../components/loading/CardSkeleton';
import { Skeleton } from '../../components/loading/Skeleton';
import { ErrorCard } from '../../components/errors/ErrorCard';

const OTP_LENGTH = 6;

interface TwoFactorStatus {
  active: boolean;
  isEnabled?: boolean;
  method: string | null;
}

export default function TwoFactorSettings() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableOtpDigits, setDisableOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [disableError, setDisableError] = useState('');

  const disableOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get('/2fa/status');
      const data = res.data.data;
      setStatus({
        active: Boolean(data?.isEnabled ?? data?.active),
        method: data?.method ?? null,
      });
    } catch (err) {
      // Never fall through to "2FA is Disabled" when we simply don't know
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }

  function openDisableModal() {
    setDisableOtpDigits(Array(OTP_LENGTH).fill(''));
    setDisableError('');
    setShowDisableModal(true);
    setTimeout(() => disableOtpRefs.current[0]?.focus(), 150);
  }

  function closeDisableModal() {
    if (disableLoading) return;
    setShowDisableModal(false);
    setDisableOtpDigits(Array(OTP_LENGTH).fill(''));
    setDisableError('');
  }

  async function handleConfirmDisable() {
    const code = disableOtpDigits.join('');
    if (code.length !== OTP_LENGTH) return;

    setDisableLoading(true);
    setDisableError('');
    try {
      await api.post('/2fa/disable', { verificationCode: code, method: status?.method });
      toast.success('2FA disabled successfully');
      setShowDisableModal(false);
      await fetchStatus();
    } catch (err: any) {
      setDisableError(err.response?.data?.error?.message || 'Invalid code. Please try again.');
      setDisableOtpDigits(Array(OTP_LENGTH).fill(''));
      disableOtpRefs.current[0]?.focus();
    } finally {
      setDisableLoading(false);
    }
  }

  function handleDisableOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...disableOtpDigits];
    newDigits[index] = digit;
    setDisableOtpDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      disableOtpRefs.current[index + 1]?.focus();
    }
  }

  function handleDisableOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !disableOtpDigits[index] && index > 0) {
      const newDigits = [...disableOtpDigits];
      newDigits[index - 1] = '';
      setDisableOtpDigits(newDigits);
      disableOtpRefs.current[index - 1]?.focus();
    }
  }

  function handleDisableOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((d, i) => (newDigits[i] = d));
      setDisableOtpDigits(newDigits);
      const nextEmpty = newDigits.findIndex((d) => d === '');
      disableOtpRefs.current[nextEmpty >= 0 ? nextEmpty : OTP_LENGTH - 1]?.focus();
    }
  }

  return (
    <div className="page-gradient-bg min-h-screen text-foreground font-sans pb-20">
      <header className="sticky top-0 z-20 pt-4">
        <div className="w-full px-6 md:px-10 py-2 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-foreground bg-card/50 hover:bg-card/80 border border-zinc-300/50 dark:border-zinc-700/50 shadow-sm px-3 py-1.5 rounded-full transition-all font-medium text-sm backdrop-blur-sm"
          >
            <ArrowLeft className="size-4" />
            Back to Settings
          </button>
        </div>
      </header>

      {loading ? (
        <div role="status" aria-busy="true" aria-label="Loading 2FA settings" className="max-w-[560px] mx-auto px-6 mt-2 sm:mt-4 space-y-6">
          <div className="flex flex-col items-center gap-3 mb-10">
            <Skeleton width={320} height={36} style={{ maxWidth: '100%' }} />
            <Skeleton width={260} height={16} style={{ maxWidth: '100%' }} />
          </div>
          <CardSkeleton rows={1} />
          <CardSkeleton rows={2} />
        </div>
      ) : loadError && !status ? (
        <main className="max-w-[560px] mx-auto px-6 mt-10">
          <ErrorCard error={loadError} title="We couldn't load your 2FA settings" onRetry={() => { void fetchStatus(); }} />
        </main>
      ) : (
        <main className="max-w-[560px] mx-auto px-6 mt-2 sm:mt-4">
        <div className="mb-10 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-light tracking-tight text-foreground">Two-Factor Authentication</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2.5 text-sm sm:text-base">Add an extra layer of security to your account.</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Status Banner Card */}
          <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-sm border border-border/60 p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${status?.active ? 'bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-300' : 'bg-muted text-muted-foreground'}`}>
                <ShieldCheck className="size-5" />
              </div>
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">{status?.active ? '2FA is Enabled' : '2FA is Disabled'}</h2>
                <p className="text-xs text-muted-foreground">{status?.active ? `Using ${status.method?.toUpperCase()} as primary method.` : 'Secure your account by enabling 2FA.'}</p>
              </div>
            </div>
            {status?.active && (
              <button 
                type="button"
                onClick={openDisableModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200/80 dark:border-red-800/60 bg-card text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800/60 font-medium text-xs shadow-xs transition-all active:scale-[0.98] shrink-0"
              >
                <Power className="size-3.5 text-red-500" />
                <span>Turn Off</span>
              </button>
            )}
          </div>

          {/* Authentication Methods */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Authentication Methods</h3>
            <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-sm border border-border/60 overflow-hidden">
              <MethodRow 
                icon={<Smartphone className="size-4" />}
                title="Authenticator App"
                description="Use an app like Google Authenticator or Authy to generate codes."
                active={status?.active && status?.method === 'totp'}
                actionLabel={status?.active && status?.method !== 'totp' ? 'Switch' : 'Setup'}
                onSetup={() => navigate('/settings/2fa/totp')}
              />
              
              <div className="h-px bg-muted w-full" />
              
              <MethodRow 
                icon={<Mail className="size-4" />}
                title="Email OTP"
                description="Receive a one-time passcode via Email."
                active={status?.active && status?.method === 'email'}
                actionLabel={status?.active && status?.method !== 'email' ? 'Switch' : 'Setup'}
                onSetup={() => navigate('/settings/2fa/email')}
              />
            </div>
          </div>

        </div>
        </main>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-[480px] bg-card rounded-[28px] p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.22)] border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={closeDisableModal}
              disabled={disableLoading}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-muted rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon badge with subtle layered glow */}
              <div className="relative mb-4 flex items-center justify-center">
                <div className="size-16 rounded-2xl bg-gradient-to-b from-rose-50 dark:from-rose-950/40 to-rose-100/80 dark:to-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
                  <ShieldAlert className="size-8" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-foreground tracking-tight">Disable 2FA</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[360px]">
                Enter the 6-digit code from your <span className="font-semibold text-zinc-700 dark:text-zinc-300">{status?.method === 'totp' ? 'authenticator app' : 'registered email'}</span> to confirm.
              </p>

              {/* 6 Digit Inputs */}
              <div className="flex gap-2.5 sm:gap-3 justify-center my-7" onPaste={handleDisableOtpPaste}>
                {disableOtpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { disableOtpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDisableOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleDisableOtpKeyDown(i, e)}
                    className={`w-12 h-14 sm:w-[54px] sm:h-[62px] text-center text-xl sm:text-2xl font-bold rounded-2xl border outline-none transition-all duration-150 ${
                      digit 
                        ? 'border-foreground bg-card text-foreground shadow-sm ring-1 ring-foreground/10' 
                        : 'border-border bg-muted/35 text-foreground hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-muted/50'
                    } focus:border-foreground focus:bg-card focus:ring-2 focus:ring-foreground/20`}
                  />
                ))}
              </div>

              {disableError && (
                <div className="mb-6 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 py-3 px-4 rounded-xl w-full text-center">
                  {disableError}
                </div>
              )}

              <div className="flex items-center gap-3.5 w-full">
                <button
                  type="button"
                  onClick={closeDisableModal}
                  disabled={disableLoading}
                  className="flex-1 py-3 px-5 rounded-2xl border border-border text-zinc-700 dark:text-zinc-300 hover:bg-muted/80 font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisable}
                  disabled={disableLoading || disableOtpDigits.some(d => !d)}
                  className={`flex-1 py-3 px-5 rounded-2xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] ${
                    disableOtpDigits.some(d => !d) || disableLoading
                      ? 'bg-muted text-zinc-400 border border-border cursor-not-allowed shadow-none'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 hover:shadow-md'
                  }`}
                >
                  {disableLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Disabling...</span>
                    </>
                  ) : (
                    <span>Disable 2FA</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodRow({ icon, title, description, active, onSetup, disabled, actionLabel = 'Setup' }: any) {
  return (
    <div className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${disabled ? 'opacity-50' : 'hover:bg-muted/40'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-muted rounded-lg text-zinc-600 dark:text-zinc-400 shrink-0">
          {icon}
        </div>
        <div className="text-left min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">{title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        {active ? (
          <span className="px-2.5 py-0.5 bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-300 text-xs font-medium rounded-full">Active</span>
        ) : (
          <button 
            onClick={onSetup}
            disabled={disabled}
            className="px-3.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium text-xs rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
