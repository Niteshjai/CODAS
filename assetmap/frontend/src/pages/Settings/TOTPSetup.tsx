import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { api } from '../../services/api';

const OTP_LENGTH = 6;

export default function TOTPSetup() {
  const navigate = useNavigate();
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function fetchSetup() {
      try {
        const res = await api.post('/2fa/totp/begin-setup');
        setSetupData(res.data.data);
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message || 'Failed to initialize TOTP setup. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchSetup();
  }, []);

  async function handleVerify() {
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) return;
    
    setVerifying(true);
    try {
      await api.post('/2fa/totp/confirm-setup', { token: code });
      toast.success('Authenticator app connected successfully!');
      navigate('/settings/2fa');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid code. Please try again.');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  function handleCopy() {
    if (setupData) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="page-gradient-bg min-h-screen text-foreground font-sans pb-20">
      <header className="sticky top-0 z-20 pt-4">
        <div className="w-full px-6 md:px-10 py-2 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('/settings/2fa')}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-foreground bg-card/50 hover:bg-card/80 border border-zinc-300/50 dark:border-zinc-700/50 shadow-sm px-3 py-1.5 rounded-full transition-all font-medium text-sm backdrop-blur-sm"
          >
            <ArrowLeft className="size-4" />
            Back to 2FA Settings
          </button>
        </div>
      </header>
      {loading ? (
        <div className="flex items-center justify-center mt-32">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-6 mt-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-display font-light tracking-tight text-foreground">Set Up Authenticator</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm sm:text-base">Connect Google Authenticator, Authy, or 1Password to secure your account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Step 1: Scan QR Code */}
            <div className="bg-card/95 backdrop-blur-md rounded-[24px] shadow-sm border border-border/60 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="size-6 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <h3 className="font-semibold text-lg text-foreground">Scan the QR Code</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Open your authenticator app and scan this code.</p>
                
                <div className="flex justify-center mb-6">
                  <div className="p-3.5 bg-card border border-border/80 rounded-2xl shadow-sm inline-flex items-center justify-center">
                    {setupData?.qrCode ? (
                      setupData.qrCode.startsWith('data:image') ? (
                        <img src={setupData.qrCode} alt="Authenticator QR Code" className="w-[180px] h-[180px] object-contain rounded-lg" />
                      ) : (
                        <QRCodeSVG value={setupData.qrCode} size={180} level="M" />
                      )
                    ) : (
                      <div className="w-[180px] h-[180px] flex items-center justify-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-border">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 text-center">Can't scan the code?</p>
                <div className="flex items-center gap-2 bg-muted/40 hover:bg-muted/50 p-2.5 rounded-xl border border-border/80 transition-colors">
                  <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex-1 break-all select-all text-center tracking-wider">{setupData?.secret}</code>
                  <button 
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 rounded-lg transition-colors shrink-0"
                    title="Copy Secret"
                  >
                    {copied ? <Check className="size-4 text-lime-600 dark:text-lime-400" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Enter 6-digit Code */}
            <div className="bg-card/95 backdrop-blur-md rounded-[24px] shadow-sm border border-border/60 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="size-6 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <h3 className="font-semibold text-lg text-foreground">Enter 6-digit code</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-8">Enter the 6-digit code generated by your authenticator app to complete setup.</p>
                
                <div className="flex gap-2 justify-center my-4" onPaste={handlePaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        const newDigits = [...otpDigits];
                        newDigits[i] = val;
                        setOtpDigits(newDigits);
                        if (val && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                          const newDigits = [...otpDigits];
                          newDigits[i - 1] = '';
                          setOtpDigits(newDigits);
                          otpRefs.current[i - 1]?.focus();
                        }
                      }}
                      className={`w-[44px] h-[52px] text-center text-xl font-bold rounded-xl border outline-none transition-all ${
                        digit 
                          ? 'border-foreground bg-muted/50 text-foreground ring-1 ring-foreground/10' 
                          : 'border-border bg-card text-foreground hover:border-zinc-300 dark:hover:border-zinc-700'
                      } focus:border-foreground focus:ring-2 focus:ring-foreground/20`}
                    />
                  ))}
                </div>

                <p className="text-xs text-zinc-400 text-center mt-4">
                  Codes refresh automatically every 30 seconds
                </p>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || otpDigits.some(d => !d)}
                  className="w-full py-3.5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-medium text-sm rounded-xl hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Enable</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
