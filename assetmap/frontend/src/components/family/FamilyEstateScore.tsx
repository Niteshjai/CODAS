import { ShieldCheck, ShieldAlert, Shield, ArrowRight, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFamilyStore } from '../../store/familyStore';
import { MemberAvatar } from './FamilyMemberCard';
import { cardClass } from './familyUi';

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-rose-500';
  const r = 15.9155;
  return (
    <div className="relative size-28 shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3.2" className="text-muted" />
        {score > 0 && (
          <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"
            strokeDasharray={`${score} 100`} className={tone} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">of 100</span>
      </div>
    </div>
  );
}

export default function FamilyEstateScore() {
  const { estate, vault } = useFamilyStore();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  if (!estate) {
    return (
      <div className={`${cardClass} p-6 h-full`} aria-busy="true">
        <div className="h-4 w-44 rounded bg-muted animate-pulse" />
        <div className="mt-6 flex items-center gap-5">
          <div className="size-28 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2"><div className="h-3 rounded bg-muted animate-pulse" /><div className="h-3 w-2/3 rounded bg-muted animate-pulse" /></div>
        </div>
        <div className="mt-6 space-y-2">{[0, 1].map(i => <div key={i} className="h-14 rounded-xl bg-muted/70 animate-pulse" />)}</div>
      </div>
    );
  }

  const score = estate.overallScore || 0;
  const withoutWill = estate.members.filter(m => !m.hasWill).length;
  const me = estate.members.find(m => m.userId === vault?.viewer.userId);
  const headline = score >= 70 ? 'Your family is well protected'
    : score >= 40 ? 'A few gaps to close'
    : 'Action needed to protect your family';

  return (
    <section className={`${cardClass} p-6 h-full flex flex-col`} aria-labelledby="family-estate-title">
      <h2 id="family-estate-title" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Shield className="size-4" />
        Estate readiness
      </h2>

      <div className="mt-4 flex items-center gap-5">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground text-balance">{headline}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {withoutWill > 0
              ? `${withoutWill} of ${estate.members.length} ${estate.members.length === 1 ? 'member has' : 'members have'} no completed will.`
              : 'Everyone has a completed will.'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Score: 70% nominees on accounts, 30% a completed will.</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {estate.members.map(m => {
          const isMe = m.userId === vault?.viewer.userId;
          return (
            <li key={m.userId} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <MemberAvatar name={m.name} color={m.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{m.name}{isMe ? ' (you)' : ''}</p>
                <p className="text-[11px] text-muted-foreground">
                  {m.totalAccounts === 0
                    ? 'No accounts linked yet'
                    : `${m.accountsWithNominee}/${m.totalAccounts} accounts have a nominee`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${m.hasWill ? 'text-emerald-600 dark:text-emerald-400' : m.willStatus === 'draft' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {m.hasWill ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                  {m.hasWill ? 'Will ready' : m.willStatus === 'draft' ? 'Will in draft' : 'No will'}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{m.estateScore}/100</span>
              </div>
            </li>
          );
        })}
      </ul>

      {me && (!me.hasWill || (me.totalAccounts > 0 && me.accountsWithNominee < me.totalAccounts)) && (
        <div className="mt-auto pt-5 grid gap-2">
          {!me.hasWill && (
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'will' })}
              className="flex items-center justify-between gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:opacity-90"
            >
              <span className="flex items-center gap-2"><FileText className="size-4" />{me.willStatus === 'draft' ? 'Finish your will' : 'Create your will'}</span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {me.totalAccounts > 0 && me.accountsWithNominee < me.totalAccounts && (
            <button
              type="button"
              onClick={() => navigate('/nominee')}
              className="flex items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <span className="flex items-center gap-2"><ShieldAlert className="size-4" />Add missing nominees</span>
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
