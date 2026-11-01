import type { ReactNode } from 'react';
import { ChevronRight, Loader2, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AppError } from '../../errors/AppError';

/** User-safe message: the backend's own copy for 4xx business errors, AppError copy otherwise. */
export function settingsErrorMessage(err: unknown, fallback: string): string {
  const fromBody = (err as any)?.response?.data?.error?.message;
  const status = (err as any)?.response?.status;
  if (typeof fromBody === 'string' && status && status < 500 && fromBody.length < 200) return fromBody;
  if (err instanceof AppError) return err.userMessage;
  return fallback;
}

export function SettingsSection({ id, title, description, icon, children }: {
  id?: string; title: string; description?: string; icon: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="rounded-3xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <header className="flex items-center gap-3 px-5 sm:px-6 py-5 border-b border-border">
        <div className="size-10 shrink-0 rounded-xl border border-border bg-muted/60 text-foreground grid place-items-center">{icon}</div>
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-base sm:text-lg font-semibold leading-tight">{title}</h2>
          {description && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 sm:px-6 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground !border-t-0">
      {children}
    </p>
  );
}

const rowBase = 'w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left';

function RowText({ label, description }: { label: ReactNode; description?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>}
    </div>
  );
}

/** A row that navigates or opens something — the whole row is the button. */
export function LinkRow({ label, description, value, onClick, tone = 'default', icon }: {
  label: ReactNode; description?: ReactNode; value?: ReactNode; onClick: () => void;
  tone?: 'default' | 'danger'; icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${rowBase} group transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer`}
    >
      {icon && <span className={`shrink-0 ${tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${tone === 'danger' ? 'text-destructive' : 'text-foreground'}`}>{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>}
      </div>
      <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
        {value}
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
}

/** A read-only fact with an optional action on the right. */
export function InfoRow({ label, value, description, action }: {
  label: ReactNode; value: ReactNode; description?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={`${rowBase} flex-wrap sm:flex-nowrap`}>
      <RowText label={label} description={description} />
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <span className="text-sm text-foreground font-medium tabular-nums">{value}</span>
        {action}
      </div>
    </div>
  );
}

/** A labelled switch: clicking anywhere on the row toggles it. */
export function ToggleRow({ id, label, description, checked, onChange, saving, disabled, locked, lockLabel, onLockedClick }: {
  id: string; label: ReactNode; description?: ReactNode; checked: boolean;
  onChange: (next: boolean) => void; saving?: boolean; disabled?: boolean;
  locked?: boolean; lockLabel?: string; onLockedClick?: () => void;
}) {
  const inactive = disabled || locked;
  return (
    <div className={`${rowBase} ${inactive ? '' : 'hover:bg-muted/50 transition-colors'}`}>
      <label htmlFor={id} className={`min-w-0 flex-1 ${inactive ? 'cursor-default' : 'cursor-pointer'}`}>
        <span className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
          {label}
          {locked && lockLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <Lock className="size-3" aria-hidden /> {lockLabel}
            </span>
          )}
        </span>
        {description && <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</span>}
      </label>
      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />}
        {locked && onLockedClick ? (
          <button
            type="button"
            onClick={onLockedClick}
            className="text-xs font-semibold rounded-full px-3 py-1.5 bg-lime-300 text-zinc-900 hover:bg-lime-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Upgrade
          </button>
        ) : (
          <Switch
            id={id}
            checked={checked}
            disabled={inactive || saving}
            onCheckedChange={onChange}
            className="data-[state=checked]:bg-lime-500 dark:data-[state=checked]:bg-lime-400"
          />
        )}
      </div>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: 'success' | 'muted' | 'warning' | 'danger' | 'info'; children: ReactNode }) {
  const tones: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    muted:   'bg-muted text-muted-foreground border-border',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    danger:  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    info:    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
