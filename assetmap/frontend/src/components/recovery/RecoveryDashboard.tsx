// ═══════════════════════════════════════════════════════════════
// Recovery Dashboard — All active recovery cases
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { getRecoveryCases, getRecoveryCaseDetail, formatPaise, type RecoveryCaseResponse, type RecoveryCaseDetail } from '../../services/recovery'
import RecoveryCard from './RecoveryCard'
import DocumentUploader from './DocumentUploader'
import TimelineTracker from './TimelineTracker'
import RecoverySuccess from './RecoverySuccess'
import { ArrowLeft, Scale, Briefcase, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { CardSkeleton } from '../loading/CardSkeleton'
import { ListSkeleton } from '../loading/ListSkeleton'
import { ErrorCard } from '../errors/ErrorCard'

const LEGAL_DISCLAIMER =
  'Codas Recovery Services assists with document preparation and ' +
  'submission tracking. We do not provide legal advice. Recovery is ' +
  'subject to government processing timelines outside our control. ' +
  'Success fee is charged only on confirmed credit to your account.'

interface RecoveryDashboardProps {
  initialCaseId?: string;
  onBack?: () => void;
}

export default function RecoveryDashboard({ initialCaseId, onBack }: RecoveryDashboardProps = {}) {
  const [cases, setCases] = useState<RecoveryCaseResponse[]>([])
  const [selectedCase, setSelectedCase] = useState<RecoveryCaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  // Initial-load failure plus how to retry that specific load
  const [loadError, setLoadError] = useState<{ error: unknown; retry: () => void } | null>(null)

  const fetchCases = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getRecoveryCases()
      setCases(data)
    } catch (err) {
      setLoadError({ error: err, retry: () => { void fetchCases() } })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCaseId) {
      handleCaseClick(initialCaseId)
    } else {
      fetchCases()
    }
  }, [initialCaseId])

  const handleCaseClick = async (caseId: string) => {
    setDetailLoading(true)
    setLoadError(null)
    try {
      const detail = await getRecoveryCaseDetail(caseId)
      setSelectedCase(detail)
    } catch (err) {
      setLoadError({ error: err, retry: () => { void handleCaseClick(caseId) } })
    } finally {
      setDetailLoading(false)
      // Opened straight into a case (initialCaseId): the list never loaded, so end its loading state too
      setLoading(false)
    }
  }

  const handleBackAction = () => {
    if (onBack) {
      onBack()
    } else {
      setSelectedCase(null)
      fetchCases()
    }
  }

  const handleDocumentUploaded = async () => {
    if (selectedCase) {
      // Background refresh: on failure keep showing the case already on screen
      try {
        const detail = await getRecoveryCaseDetail(selectedCase.id)
        setSelectedCase(detail)
      } catch { /* banner/toast layer already reports connectivity problems */ }
    }
  }

  // ─── Case Detail View ───
  if (detailLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading recovery case" className="max-w-2xl px-2 mt-4 space-y-6">
        <CardSkeleton rows={3} />
        <ListSkeleton rows={3} />
      </div>
    )
  }

  if (selectedCase) {
    const isCompleted = selectedCase.status === 'completed'

    if (isCompleted) {
      return (
        <div className="pb-12 font-sans">
          <div className="max-w-2xl px-2 mt-4">
            <button onClick={handleBackAction} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6 text-sm">
              <ArrowLeft className="size-4" /> Back to recoveries
            </button>
            <RecoverySuccess
              recoveredAmount={selectedCase.recovered_value_paise || selectedCase.estimated_value_paise}
              feeAmount={selectedCase.feeDetails.totalPaise}
              assetDescription={selectedCase.asset_description}
              onDismiss={handleBackAction}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="pb-12 font-sans text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
          {/* Back button */}
          <button onClick={handleBackAction} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition mb-6 text-sm font-medium -ml-4 sm:-ml-8 lg:-ml-16 xl:-ml-24 2xl:-ml-32 group">
            <div className="size-9 rounded-full border border-border/80 bg-card flex items-center justify-center shadow-sm group-hover:border-zinc-300 dark:group-hover:border-zinc-700 group-hover:shadow transition-all">
              <ArrowLeft className="size-4" />
            </div>
            Back
          </button>

          {/* Case header - Full Width */}
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-foreground tracking-tight">
              {selectedCase.asset_description}
            </h1>
            <p className="text-muted-foreground text-[16px] mt-1.5 flex items-center gap-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedCase.institution_name}</span> 
              <span className="text-zinc-300">•</span> 
              <span>{selectedCase.config.label}</span>
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Column: Details & Documents */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* Value card */}
              <div className="bg-card border border-border/80 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Estimated Value</p>
                    <p className="text-3xl font-bold text-[#10b981] tracking-tight">
                      {formatPaise(selectedCase.estimated_value_paise)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Success Fee</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {selectedCase.fee_pct}% = {formatPaise(selectedCase.feeDetails.feeAmountPaise)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-5 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">Overall Progress</span>
                    <span className="text-[13px] font-bold text-emerald-600">{selectedCase.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${selectedCase.progress}%` }}
                    />
                  </div>
                </div>

                {selectedCase.estimate.daysRemaining != null && (
                  <p className="text-[13px] font-medium text-muted-foreground mt-4 flex items-center gap-1.5 bg-muted/50 inline-flex px-3 py-1.5 rounded-lg border border-border/60">
                    <Clock className="size-3.5 text-zinc-400" />
                    Estimated {selectedCase.estimate.daysRemaining} days remaining
                  </p>
                )}
              </div>

              {/* Documents section */}
              {['documents_collecting', 'additional_docs_needed'].includes(selectedCase.status) && (
                <div className="bg-card border border-border/80 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow">
                  <DocumentUploader
                    caseId={selectedCase.id}
                    documents={selectedCase.documents}
                    onDocumentUploaded={handleDocumentUploaded}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Timeline & Process */}
            <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-6">

              {/* Timeline */}
              <div className="bg-card border border-border/80 rounded-[24px] p-6 shadow-sm">
                <h3 className="text-[16px] font-bold text-foreground mb-5 tracking-tight">Recovery Timeline</h3>
                <TimelineTracker
                  entries={selectedCase.timeline}
                  progress={selectedCase.progress}
                />
              </div>

              {/* Process steps */}
              <div className="bg-card border border-border/80 rounded-[24px] p-6 shadow-sm">
                <h3 className="text-[16px] font-bold text-foreground mb-4 tracking-tight">Recovery Process</h3>
                <div className="space-y-2">
                  {selectedCase.config.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      </div>
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal disclaimer */}
              <div className="bg-muted/50 border border-border/60 rounded-xl p-4 flex items-start gap-3">
                <Scale className="size-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {LEGAL_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Cases List View ───
  const activeCases    = cases.filter(c => !['completed', 'rejected', 'withdrawn'].includes(c.status))
  const completedCases = cases.filter(c => c.status === 'completed')
  const totalEstimated = cases.reduce((sum, c) => sum + c.estimated_value_paise, 0)

  return (
    <div className="pb-12 text-foreground font-sans">
      <div className="max-w-4xl px-2 mt-4">
        {/* Header */}
        <div className="flex flex-col mb-8 gap-1">
          <h1 className="text-[26px] font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Briefcase className="size-6 text-foreground" strokeWidth={1.5} />
            Recovery Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-[15px]">
            Track all your active asset recovery cases.
          </p>
        </div>

        {/* Stats */}
        {cases.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card border border-border/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Active</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeCases.length}</p>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Done</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{completedCases.length}</p>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-[#10b981]" strokeWidth={2} />
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Value</span>
              </div>
              <p className="text-2xl font-bold text-[#10b981]">{formatPaise(totalEstimated)}</p>
            </div>
          </div>
        )}

        {loading || detailLoading ? (
          <ListSkeleton rows={3} />
        ) : loadError ? (
          // A failed load is not "no recovery cases yet"
          <ErrorCard error={loadError.error} title="We couldn't load your recoveries" onRetry={loadError.retry} />
        ) : cases.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-[24px] p-10 text-center">
            <Briefcase className="size-12 text-zinc-300 mx-auto mb-4" strokeWidth={1.25} />
            <h3 className="text-lg font-semibold text-foreground mb-2">No recovery cases yet</h3>
            <p className="text-muted-foreground text-[15px] max-w-[24rem] mx-auto">
              Go to <span className="font-medium text-zinc-700 dark:text-zinc-300">Unclaimed Wealth</span> to discover and start recovering your unclaimed assets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(c => (
              <RecoveryCard
                key={c.id}
                caseData={c}
                onClick={() => handleCaseClick(c.id)}
              />
            ))}
          </div>
        )}

        {/* Legal disclaimer */}
        <div className="mt-8 bg-muted/50 border border-border/60 rounded-xl p-4 flex items-start gap-3">
          <Scale className="size-4 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.75} />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {LEGAL_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  )
}
