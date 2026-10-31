import { useMemo, useState, useEffect } from 'react';
import { Check, AlertTriangle, Sparkles, Users, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
import { toast } from 'sonner';

interface ShieldProps {
  totalAssets?: number;
  totalAccounts: number;
  nomineeCoveredCount: number;
  totalNomineeAccounts: number;
  hasWill: boolean;
  hasDormantAccounts: boolean;
  landRecordsCount: number;
  hasInsurance: boolean;
  onSelectTab?: (tab: any) => void;
}

interface ChecklistItem {
  key: string;
  label: string;
  sublabel: string;
  done: boolean;
  points: number;
  actionText: string;
  tab?: string;
  route?: string;
  featureKey?: string;
}

export default function FinancialShield({
  totalAccounts,
  nomineeCoveredCount,
  totalNomineeAccounts,
  hasWill,
  hasDormantAccounts,
  landRecordsCount,
  hasInsurance,
  onSelectTab,
}: ShieldProps) {
  const navigate = useNavigate();
  const { hasFeature } = usePlanStore();

  const checklist = useMemo<ChecklistItem[]>(() => [
    {
      key: 'nominees',
      label: 'Nominees Assigned',
      sublabel: nomineeCoveredCount >= (totalNomineeAccounts || 6) ? 'All accounts covered' : `${nomineeCoveredCount}/${totalNomineeAccounts || totalAccounts || 6} accounts assigned`,
      done: (totalNomineeAccounts > 0 && nomineeCoveredCount >= totalNomineeAccounts) || nomineeCoveredCount >= 6,
      points: 25,
      actionText: 'Assign',
      route: '/nominee/update',
    },
    {
      key: 'will',
      label: 'Digital Will',
      sublabel: hasWill ? 'Estate plan created' : 'Not drafted yet',
      done: hasWill,
      points: 20,
      actionText: 'Draft',
      tab: 'will',
      featureKey: 'will_builder',
    },
    {
      key: 'insurance',
      label: 'Insurance Cover',
      sublabel: hasInsurance ? 'Policy verified active' : 'Coverage unverified',
      done: hasInsurance,
      points: 15,
      actionText: 'Check',
      tab: 'insurance',
    },
    {
      key: 'assets',
      label: 'Asset Discovery',
      sublabel: totalAccounts > 0 ? `${totalAccounts} accounts linked` : 'No accounts synced',
      done: totalAccounts > 0,
      points: 15,
      actionText: 'Sync',
      tab: 'discovery',
    },
    {
      key: 'dormant',
      label: 'Account Activity',
      sublabel: !hasDormantAccounts ? 'No dormant accounts' : 'Dormant funds detected',
      done: !hasDormantAccounts,
      points: 15,
      actionText: 'Review',
      tab: 'unclaimed',
      featureKey: 'unclaimed_search',
    },
    {
      key: 'property',
      label: 'Property Records',
      sublabel: landRecordsCount > 0 ? `${landRecordsCount} parcel(s) linked` : 'No land records linked',
      done: landRecordsCount > 0,
      points: 10,
      actionText: 'Link',
      tab: 'land',
      featureKey: 'land_records',
    },
  ], [totalAccounts, nomineeCoveredCount, totalNomineeAccounts, hasWill, hasInsurance, landRecordsCount, hasDormantAccounts]);

  const score = useMemo(() => {
    return checklist.reduce((sum, item) => sum + (item.done ? item.points : 0), 0);
  }, [checklist]);

  const completedCount = checklist.filter(i => i.done).length;
  const totalCount = checklist.length;

  // Animated score counter
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 900;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getLevel = (s: number) => {
    if (s >= 90) return { label: 'Fortress', color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-400/15', ring: '#84cc16' };
    if (s >= 70) return { label: 'Strong', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/15', ring: '#10b981' };
    if (s >= 40) return { label: 'Growing', color: 'text-zinc-800 dark:text-zinc-200', bg: 'bg-lime-300/25', ring: '#84cc16' };
    return { label: 'Vulnerable', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-400/15', ring: '#f43f5e' };
  };

  const level = getLevel(score);
  const percentile = Math.min(99, Math.round(40 + score * 0.55));

  const handleAction = (item: ChecklistItem) => {
    if (item.featureKey && !hasFeature(item.featureKey)) {
      toast.error('Premium Feature', {
        description: 'This feature is only available for premium subscribers.',
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/pricing')
        }
      });
      return;
    }

    if (item.route) {
      navigate(item.route);
    } else if (item.tab) {
      if (onSelectTab) {
        onSelectTab(item.tab);
      } else {
        navigate(`/dashboard?tab=${item.tab}`);
      }
    }
  };

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-zinc-300 dark:border-[#2E3148] flex flex-col h-full">
      
      {/* Header & Score Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-300/70 dark:border-white/5 mb-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <svg width="78" height="78" viewBox="0 0 78 78" className="transform -rotate-90">
              <circle cx="39" cy="39" r={radius} fill="none" className="stroke-zinc-300/60 dark:stroke-white/10" strokeWidth="6" />
              <circle
                cx="39" cy="39" r={radius} fill="none"
                stroke={level.ring}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-display tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">{displayScore}</span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Protection Shield</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${level.bg} ${level.color}`}>
                <Sparkles className="size-3" />
                {level.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {completedCount} of {totalCount} safety checks completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white/70 dark:bg-white/5 px-3 py-1.5 rounded-full border border-zinc-200/80 dark:border-white/10">
            <Users className="size-3.5 text-zinc-400" />
            <span>Top <strong className="text-zinc-900 dark:text-lime-400 font-semibold">{percentile}%</strong> of users</span>
          </span>
        </div>
      </div>

      {/* Clean 2-Column Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {checklist.map(item => (
          <div
            key={item.key}
            onClick={() => !item.done && handleAction(item)}
            className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl transition-all duration-150 border ${
              item.done
                ? 'bg-white/40 dark:bg-white/[0.02] border-zinc-200/60 dark:border-white/5'
                : 'bg-white/80 dark:bg-white/[0.05] border-zinc-200/90 dark:border-white/10 shadow-sm hover:border-lime-400/60 hover:shadow hover:scale-[1.01] cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`size-7 rounded-xl flex items-center justify-center shrink-0 ${
                item.done
                  ? 'bg-lime-400 text-zinc-950'
                  : 'bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-zinc-400'
              }`}>
                {item.done
                  ? <Check className="size-4 stroke-[2.5]" />
                  : <AlertTriangle className="size-3.5 stroke-[2]" />
                }
              </div>

              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate ${
                  item.done ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {item.label}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {item.sublabel}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {item.done ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-lime-400">
                  +{item.points}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item);
                  }}
                  className="inline-flex items-center gap-1 bg-lime-300 hover:bg-lime-400 text-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm transition active:scale-95"
                >
                  <span>+{item.points}</span>
                  <ArrowUpRight className="size-3 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
