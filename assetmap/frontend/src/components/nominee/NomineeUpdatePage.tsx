import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Zap, FileText, Building2 } from 'lucide-react';
import NomineeForm from './NomineeForm';
import ProgressTracker from './ProgressTracker';
import GuidedOTPSession from './GuidedOTPSession';
import NomineeSuccess from './NomineeSuccess';
import { getMissingNominees, startNomineeUpdate } from '../../services/nominee';
import type { NomineeInput, MissingAccount } from '../../services/nominee';
import { useAssetStore } from '../../store/assetStore';
import { Skeleton } from '../loading/Skeleton';
import { ErrorCard } from '../errors/ErrorCard';

// ═══════════════════════════════════════════════════════════════
// NomineeUpdatePage — "Fill Once, Update Everywhere"
//
// 4-step flow:
//   1. form     → Collect nominee details
//   2. review   → Show which accounts will be updated
//   3. progress → Real-time tracker per institution
//   4. complete → Success screen
// ═══════════════════════════════════════════════════════════════

type Step = 'form' | 'review' | 'progress' | 'complete';

export default function NomineeUpdatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetAssetIds: string[] | undefined = location.state?.assetIds;
  const targetInstitution: string | undefined = location.state?.institutionName;

  const [step, setStep]             = useState<Step>('form');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Data
  const [missingAccounts, setMissing]   = useState<MissingAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError]     = useState<unknown>(null);
  const [nominees, setNominees]         = useState<NomineeInput[]>([]);
  const [batchId, setBatchId]           = useState<string | null>(null);
  const [batchSummary, setBatchSummary] = useState<any>(null);

  // Guided OTP session
  const [activeSessionTaskId, setActiveSessionTaskId] = useState<string | null>(null);

  // Scroll to top on mount and step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Fetch missing accounts on mount
  const loadMissingAccounts = useCallback(() => {
    setAccountsLoading(true);
    setAccountsError(null);
    getMissingNominees()
      .then(data => {
        setMissing(data.accounts);
      })
      .catch(err => setAccountsError(err))
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => { loadMissingAccounts(); }, [loadMissingAccounts]);

  // Compute filtered accounts based on targetAssetIds
  const filteredAccounts = targetAssetIds 
    ? missingAccounts.filter(a => targetAssetIds.includes(a.id))
    : missingAccounts;

  const totalValueAtRiskPaise = filteredAccounts.reduce((sum, a) => sum + parseInt(a.current_value_paise || '0'), 0);
  
  const summaryByType = {
    mutualFund: filteredAccounts.filter(r => r.asset_class === 'MUTUAL_FUND').length,
    epf:        filteredAccounts.filter(r => r.asset_class === 'EPF').length,
    nps:        filteredAccounts.filter(r => r.asset_class === 'NPS').length,
    bank:       filteredAccounts.filter(r => ['BANK_ACCOUNT', 'FIXED_DEPOSIT', 'PPF'].includes(r.asset_class)).length,
    equity:     filteredAccounts.filter(r => r.asset_class === 'EQUITY').length,
    insurance:  filteredAccounts.filter(r => ['INSURANCE_LIFE', 'INSURANCE_HEALTH'].includes(r.asset_class)).length,
  };

  // Step 1 → 2: Form submitted
  const handleFormSubmit = (noms: NomineeInput[]) => {
    setNominees(noms);
    setStep('review');
  };

  // Step 2 → 3: Confirm and start the batch
  const handleStartBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startNomineeUpdate(nominees, targetAssetIds);
      setBatchId(result.batchId);
      setBatchSummary(result.summary);
      setStep('progress');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  // All tasks completed
  const handleAllComplete = useCallback(() => {
    setStep('complete');
  }, []);

  // Guided session completed
  const handleSessionDone = () => {
    setActiveSessionTaskId(null);
  };

  return (
    <div className="page-gradient-bg min-h-screen flex flex-col text-foreground font-sans">
      {/* Top Navigation Bar */}
      {step !== 'complete' && (
        <nav className="bg-white/30 dark:bg-card/40 backdrop-blur-xl px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-white/20 shadow-sm">
          <button 
            onClick={() => {
              if (step === 'form') navigate('/dashboard', { state: { openNomineeModal: true } });
              else if (step === 'review') setStep('form');
            }} 
            className="flex items-center gap-2 text-foreground hover:text-foreground bg-card/50 hover:bg-card/80 border border-zinc-300/50 dark:border-zinc-700/50 shadow-sm px-3 py-1.5 rounded-full transition-all font-medium text-sm backdrop-blur-sm"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>
          <div className="font-semibold tracking-wide text-foreground">
            {targetInstitution || 'Update Nominees'}
          </div>
          <div className="w-20 hidden sm:block"></div> {/* Spacer for perfect centering on desktop */}
        </nav>
      )}

      <main className="flex-1 w-full max-w-[672px] mx-auto px-4 py-8">

        {/* Page header */}
        {(step === 'form' || step === 'review') && (
          <div className="mb-6">
            <p className="text-muted-foreground text-sm max-w-[500px]">
              {targetInstitution
                ? `Update the nominee details specifically for your ${targetInstitution} account.`
                : 'Fill one form. We update your nominees across all your financial accounts — mutual funds, EPF, NPS, banks, insurance, and demat & trading accounts.'}
            </p>

            {/* Summary badges */}
            {accountsLoading && (
              <div role="status" aria-busy="true" aria-label="Loading accounts" className="flex flex-wrap items-center gap-2 mt-4">
                <Skeleton width={190} height={24} radius={999} />
                <Skeleton width={120} height={24} radius={999} />
              </div>
            )}
            {!accountsLoading && accountsError != null && (
              <div className="mt-4">
                <ErrorCard compact error={accountsError} onRetry={loadMissingAccounts} />
              </div>
            )}
            {!accountsLoading && filteredAccounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                  {filteredAccounts.length} account{filteredAccounts.length > 1 ? 's' : ''} missing nominees
                </span>
                {totalValueAtRiskPaise > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    ₹{(totalValueAtRiskPaise / 100).toLocaleString('en-IN')} at risk
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legal disclaimer (at top of form) */}
        {step === 'form' && (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-6 flex items-start gap-3 border border-border">
            <Shield className="size-5 text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Codas facilitates nominee updates on your behalf where permitted by law.
              For banks, EPFO, and insurers, you will complete a simple OTP step inside our app.
              We never store your banking passwords or government portal credentials.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 mb-6 text-red-600 dark:text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* ═════ Step 1: Form ═════ */}
        {step === 'form' && (
          <NomineeForm onSubmit={handleFormSubmit} loading={loading} />
        )}

        {/* ═════ Step 2: Review ═════ */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Nominee summary */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="size-5" /> Nominee{nominees.length > 1 ? 's' : ''} to Apply
              </h3>
              <div className="space-y-2">
                {nominees.map((n, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.nomineeName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{n.relationship} • DOB: {n.nomineeDob}</p>
                    </div>
                    {nominees.length > 1 && (
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{n.allocationPct}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Accounts breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-3">
                Accounts to Update ({filteredAccounts.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {summaryByType.mutualFund > 0 && (
                  <MethodCard icon={<Zap />} label="Mutual Funds" count={summaryByType.mutualFund} method="Automatic" color="emerald" />
                )}
                {summaryByType.epf > 0 && (
                  <MethodCard icon={<Building2 />} label="EPF" count={summaryByType.epf} method="Guided OTP" color="blue" />
                )}
                {summaryByType.nps > 0 && (
                  <MethodCard icon={<Building2 />} label="NPS" count={summaryByType.nps} method="Guided OTP" color="blue" />
                )}
                {summaryByType.bank > 0 && (
                  <MethodCard icon={<Building2 />} label="Banks" count={summaryByType.bank} method="Guided OTP" color="blue" />
                )}
                {summaryByType.equity > 0 && (
                  <MethodCard icon={<Building2 />} label="Demat & Trading" count={summaryByType.equity} method="Guided OTP" color="blue" />
                )}
                {summaryByType.insurance > 0 && (
                  <MethodCard icon={<FileText />} label="Insurance" count={summaryByType.insurance} method="Form + Email" color="amber" />
                )}
              </div>
            </div>

            {/* Confirm button */}
            <button onClick={handleStartBatch} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting updates...
                </>
              ) : (
                <>Start Nominee Updates</>
              )}
            </button>
          </div>
        )}

        {/* ═════ Step 3: Progress ═════ */}
        {step === 'progress' && batchId && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Updating Nominees</h2>
              <p className="text-muted-foreground text-sm">Real-time progress across all your accounts</p>
            </div>
            <ProgressTracker
              batchId={batchId}
              onOpenSession={(taskId) => setActiveSessionTaskId(taskId)}
              onAllComplete={handleAllComplete}
            />
          </>
        )}

        {/* ═════ Step 4: Complete ═════ */}
        {step === 'complete' && batchSummary && (
          <NomineeSuccess
            summary={batchSummary}
            onGoBack={() => {
              useAssetStore.setState({ nomineeData: null });
              navigate('/dashboard');
            }}
          />
        )}
      </main>

      {/* Guided OTP Session Modal */}
      {activeSessionTaskId && (
        <GuidedOTPSession
          taskId={activeSessionTaskId}
          onClose={() => setActiveSessionTaskId(null)}
          onDone={handleSessionDone}
        />
      )}
    </div>
  );
}

function MethodCard({ icon, label, count, method, color }: {
  icon: React.ReactNode; label: string; count: number; method: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/60',
    blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/60',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/60',
  };
  return (
    <div className={`rounded-xl p-3 border ${colors[color] ?? colors.blue}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="size-4">{icon}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px] opacity-70">{method}</p>
    </div>
  );
}
