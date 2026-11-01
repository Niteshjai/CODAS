import { Activity as ActivityIcon, UserPlus, UserCheck, UserMinus, Target, PartyPopper, PiggyBank, Trophy, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import { useFamilyStore } from '../../store/familyStore';
import { cardClass, timeAgo } from './familyUi';

const ICONS: Record<string, { icon: typeof ActivityIcon; tone: string }> = {
  member_invited:     { icon: UserPlus,    tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
  member_joined:      { icon: UserCheck,   tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  member_left:        { icon: UserMinus,   tone: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
  goal_created:       { icon: Target,      tone: 'bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-300' },
  goal_contribution:  { icon: PiggyBank,   tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
  goal_completed:     { icon: PartyPopper, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  goal_cancelled:     { icon: Trash2,      tone: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
  networth_milestone: { icon: Trophy,      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  will_created:       { icon: FileText,    tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
  nominee_added:      { icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
};

export default function FamilyActivity() {
  const { activities, detailsLoading } = useFamilyStore();

  return (
    <section className={`${cardClass} p-6 h-full flex flex-col`} aria-labelledby="family-activity-title">
      <h2 id="family-activity-title" className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
        <ActivityIcon className="size-4" />
        Recent activity
      </h2>

      {activities.length === 0 ? (
        detailsLoading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-muted/60 animate-pulse" />)}</div>
        ) : (
          <p className="flex-1 grid place-items-center rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Joins, goals and contributions from your family will show up here.
          </p>
        )
      ) : (
        <ol className="relative space-y-4 max-h-[26rem] overflow-y-auto pr-1">
          {activities.map((a) => {
            const meta = ICONS[a.activityType] ?? { icon: ActivityIcon, tone: 'bg-muted text-muted-foreground' };
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex gap-3">
                <span className={`size-8 rounded-lg grid place-items-center shrink-0 ${meta.tone}`} aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug">{a.title}</p>
                  {a.body && <p className="text-[11px] text-muted-foreground truncate">{a.body}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    <time dateTime={a.createdAt}>{timeAgo(a.createdAt)}</time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
