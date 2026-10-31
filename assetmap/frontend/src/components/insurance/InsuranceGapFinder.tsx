import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Umbrella, Activity, HeartPulse, Loader2, IndianRupee, Users, CalendarClock, Landmark, Sparkles, ArrowLeft, ArrowUpRight, Minus, Plus } from 'lucide-react';
import InsuranceCoverageCard from './InsuranceCoverageCard';
import { api } from '../../services/api';
import { toast } from 'sonner';

function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)} K`;
  return `${amount.toLocaleString('en-IN')}`;
}

function formatINR(paise: number): string {
  const v = paise / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function InsuranceGapFinder() {
  const [profile, setProfile] = useState({
    annualIncomePaise: 120000000,
    age: 30,
    dependentsCount: 2,
    outstandingLoansPaise: 50000000,
    monthlyExpensesPaise: 4000000
  });

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const res = await api.get('/insurance/latest');
        if (res.data?.success && res.data.data) {
          if (res.data.data.profile) {
            setProfile(res.data.data.profile);
          }
        }
      } catch (err) {
        console.error('Failed to load live insurance data', err);
      }
    }
    loadLiveData();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await api.post('/insurance/analyze', { profile });
      if (res.data?.success) {
        setAnalysis(res.data.data);
      } else {
        toast.error('Could not compute insurance gap analysis');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to analyze insurance gaps');
    } finally {
      setLoading(false);
    }
  };

  const handlePaiseInputChange = (name: 'annualIncomePaise' | 'outstandingLoansPaise' | 'monthlyExpensesPaise') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const value = Number(raw) || 0;
    setProfile(prev => ({
      ...prev,
      [name]: value * 100
    }));
  };

  const adjustNumber = (name: 'age' | 'dependentsCount', delta: number) => {
    setProfile(prev => ({
      ...prev,
      [name]: Math.max(0, prev[name] + delta)
    }));
  };

  const annualIncome = profile.annualIncomePaise / 100;
  const monthlyExpenses = profile.monthlyExpensesPaise / 100;
  const outstandingLoans = profile.outstandingLoansPaise / 100;

  return (
    <div className="w-full max-w-[1400px] mx-auto pt-2 pb-0 relative flex flex-col md:max-h-[calc(100vh-180px)] md:overflow-hidden">
      {analysis ? (
        /* Back Button Bar on Results Page (Placed on Left) */
        <div className="w-full flex items-center justify-start px-0 pt-1 mb-4 shrink-0">
          <button
            onClick={() => setAnalysis(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1A1D27]/90 backdrop-blur-md border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </button>
        </div>
      ) : (
        /* Top Header Bar on Profile Input Page */
        <div className="w-full max-w-3xl shrink-0">
          <div className="flex flex-col items-start text-left gap-1 mb-4">
            <h1 className="text-[26px] font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-start gap-2.5">
              <Umbrella className="size-7 text-lime-500" />
              Insurance Gap Finder
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              Discover critical gaps in your family's protection.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-visible md:overflow-y-auto custom-scrollbar md:pr-2 pb-2 min-h-0">
        <div className={`w-full ${!analysis ? "max-w-3xl" : "max-w-5xl"}`}>
        {!analysis ? (
          <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-zinc-300 dark:border-[#2E3148] space-y-4 text-left">

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-zinc-300/70 dark:border-white/5 pb-2">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Your Profile Details</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Fill these details to generate a personalized insurance gap analysis.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-300/30 dark:bg-lime-400/10 px-2.5 py-1 text-xs font-semibold text-lime-700 dark:text-lime-400">
                <Sparkles className="size-3.5" />
                Smart inputs
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Annual Income */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="size-3.5 text-lime-600 dark:text-lime-400" />
                    Annual Income
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium lowercase">
                    ({formatLakhs(annualIncome)}/yr)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">₹</span>
                  <input
                    type="text"
                    value={annualIncome ? annualIncome.toLocaleString('en-IN') : ''}
                    onChange={handlePaiseInputChange('annualIncomePaise')}
                    placeholder="12,00,000"
                    className="w-full pl-8 pr-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
                  />
                </div>
              </div>

              {/* Current Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-lime-600 dark:text-lime-400" />
                  Age
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustNumber('age', -1)}
                    className="size-10 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="number"
                    name="age"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-sm font-semibold text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber('age', 1)}
                    className="size-10 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Number of Dependents */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="size-3.5 text-lime-600 dark:text-lime-400" />
                  Number of Dependents
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustNumber('dependentsCount', -1)}
                    className="size-10 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="number"
                    name="dependentsCount"
                    value={profile.dependentsCount}
                    onChange={(e) => setProfile({ ...profile, dependentsCount: Number(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-sm font-semibold text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber('dependentsCount', 1)}
                    className="size-10 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Outstanding Loans */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Landmark className="size-3.5 text-lime-600 dark:text-lime-400" />
                    Outstanding Loans
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium lowercase">
                    ({formatLakhs(outstandingLoans)})
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">₹</span>
                  <input
                    type="text"
                    value={outstandingLoans ? outstandingLoans.toLocaleString('en-IN') : ''}
                    onChange={handlePaiseInputChange('outstandingLoansPaise')}
                    placeholder="5,00,000"
                    className="w-full pl-8 pr-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
                  />
                </div>
              </div>

              {/* Monthly Living Expenses */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="size-3.5 text-lime-600 dark:text-lime-400" />
                    Monthly Expenses
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium lowercase">
                    ({formatLakhs(monthlyExpenses)}/mo)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">₹</span>
                  <input
                    type="text"
                    value={monthlyExpenses ? monthlyExpenses.toLocaleString('en-IN') : ''}
                    onChange={handlePaiseInputChange('monthlyExpensesPaise')}
                    placeholder="40,000"
                    className="w-full pl-8 pr-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-white/80 dark:border-white/5 backdrop-blur-md">
              <div className="text-center">
                <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Income</div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatINR(profile.annualIncomePaise)}</div>
              </div>
              <div className="text-center border-x border-zinc-200/80 dark:border-white/10 px-1">
                <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Loans</div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatINR(profile.outstandingLoansPaise)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Monthly Burn</div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatINR(profile.monthlyExpensesPaise)}</div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-2.5 px-6 rounded-2xl bg-lime-300 hover:bg-lime-400 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(190,242,100,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Running Underwriting Models...</span>
                </>
              ) : (
                <>
                  <span>Run Gap Analysis</span>
                  <ArrowUpRight className="size-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsuranceCoverageCard
                title="Life & Term Cover"
                current={analysis.totalLifeCoverPaise + analysis.totalTermCoverPaise}
                recommended={analysis.recommendedLifePaise + analysis.recommendedTermPaise}
                gap={analysis.lifeGapPaise + analysis.termGapPaise}
                icon={<ShieldAlert className="size-5 text-purple-500" />}
              />
              <InsuranceCoverageCard
                title="Health Cover"
                current={analysis.totalHealthCoverPaise}
                recommended={analysis.recommendedHealthPaise}
                gap={analysis.healthGapPaise}
                icon={<HeartPulse className="size-5 text-rose-500" />}
              />

              {/* Scorecard */}
              <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 shadow-sm backdrop-blur-xl rounded-[28px] p-5 border border-zinc-300 dark:border-[#2E3148] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Protection Score</span>
                  <Activity className="size-4 text-zinc-400" />
                </div>
                <div className="my-2">
                  <div className={`text-3xl sm:text-4xl font-bold font-display ${analysis.gapScore > 80 ? 'text-emerald-600 dark:text-lime-400' : analysis.gapScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {analysis.gapScore} <span className="text-sm text-zinc-500 font-normal">/ 100</span>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>Severity:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{analysis.gapSeverity}</span>
                </div>
              </div>
            </div>

            {/* Identified Gaps Card */}
            <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-zinc-300 dark:border-[#2E3148] shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">Identified Protection Gaps</h3>
              <div className="space-y-3">
                {analysis.gaps.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-lime-400 font-medium text-sm">
                    <ShieldCheck className="size-5" />
                    <span>Your insurance coverage looks solid. No critical gaps found!</span>
                  </div>
                ) : (
                  analysis.gaps.map((gap: any, i: number) => (
                    <div key={i} className="p-4 bg-white/80 dark:bg-white/[0.04] rounded-2xl border border-rose-200/60 dark:border-rose-500/20 shadow-sm flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400">{gap.title}</h4>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                          Shortfall: {formatINR(gap.shortfall)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{gap.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div className="bg-gradient-to-br from-lime-50/80 via-white/80 to-lime-50/80 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-lime-300/40 dark:border-lime-400/20 shadow-sm">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">Actionable Recommendations</h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-white/90 dark:bg-white/[0.04] rounded-2xl border border-lime-200/80 dark:border-white/10 shadow-sm">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{rec.title}</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{rec.description}</p>
                      </div>
                      <button
                        className="shrink-0 inline-flex items-center gap-1 bg-lime-300 hover:bg-lime-400 text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                        onClick={() => window.open(rec.affiliateUrl || 'https://www.policybazaar.com/', '_blank', 'noopener,noreferrer')}
                      >
                        <span>Compare Plans</span>
                        <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
