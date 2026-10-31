import { CheckCircle2, PartyPopper, ArrowLeft, Shield } from 'lucide-react';

interface NomineeSuccessProps {
  summary: {
    totalAccounts: number;
    autoProcessed: number;
    requiresOTP:   number;
    formEmailed:   number;
  };
  onGoBack: () => void;
}

export default function NomineeSuccess({ summary, onGoBack }: NomineeSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      {/* Animated success icon */}
      <div className="relative mb-6">
        <div className="size-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center animate-[bounceIn_0.6s_ease-out]">
          <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 animate-bounce">
          <PartyPopper className="size-8 text-amber-500" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        Nominee Updates Initiated! 🎉
      </h2>
      <p className="text-muted-foreground text-sm max-w-[512px] mb-8">
        Your nominee details have been submitted across all your accounts.
        We'll verify each update via Account Aggregator data in 30 days.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-[512px] mb-8">
        <SummaryCard label="Total" value={summary.totalAccounts} color="bg-zinc-900 dark:bg-zinc-800 text-white" />
        <SummaryCard label="Auto" value={summary.autoProcessed} color="bg-emerald-50 text-emerald-700 dark:text-emerald-300" />
        <SummaryCard label="OTP Done" value={summary.requiresOTP} color="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" />
        <SummaryCard label="Emailed" value={summary.formEmailed} color="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" />
      </div>

      {/* What happens next */}
      <div className="bg-muted/50 rounded-2xl p-5 w-full max-w-[512px] text-left mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">What happens next?</h3>
        <ul className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
            Mutual fund nominees are updated automatically via CAMS — no action needed.
          </li>
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
            For EPFO, NPS, and banks, you completed the OTP steps — the institutions will process your request.
          </li>
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
            Insurance companies will receive your pre-filled nominee change form via email.
          </li>
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
            In 30 days, we'll automatically verify all updates by re-fetching your Account Aggregator data.
          </li>
        </ul>
      </div>

      {/* Legal disclaimer */}
      <div className="bg-muted/80 rounded-xl p-4 w-full max-w-[512px] mb-8 flex items-start gap-3 text-left">
        <Shield className="size-5 text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Codas facilitates nominee updates on your behalf where permitted by law.
          For banks, EPFO, and insurers, you will complete a simple OTP step inside our app.
          We never store your banking passwords or government portal credentials.
        </p>
      </div>

      <button onClick={onGoBack}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors shadow-lg">
        <ArrowLeft className="size-4" /> Back to Dashboard
      </button>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}
