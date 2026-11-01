import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon, AlertTriangle, Bell, BellOff, CheckCheck, CheckCircle2, History, Info, ListChecks, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard';
import { Skeleton } from '../loading/Skeleton';
import { useAssetStore } from '../../store/assetStore';
import {
  needsAction, useNotificationStore,
  type NotificationItem, type NotificationSeverity,
} from '../../store/notificationStore';

/* ═══════════════════════════════════════════════════
   Notification center — the bell in the dashboard header.
   Alerts, live to-dos and account activity from GET /api/notifications.
   ═══════════════════════════════════════════════════ */

const POLL_MS = 60_000;
const FOCUS_REFRESH_AFTER_MS = 10_000;

type Filter = 'all' | 'action' | 'activity';

const SEVERITY: Record<NotificationSeverity, { icon: typeof Info; tone: string; label: string }> = {
  critical: { icon: AlertOctagon,  tone: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',       label: 'Urgent' },
  warning:  { icon: AlertTriangle, tone: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',   label: 'Warning' },
  info:     { icon: Info,          tone: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',             label: 'Info' },
  success:  { icon: CheckCircle2,  tone: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300', label: 'Done' },
};

const SEVERITY_RANK: Record<NotificationSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };

const EMPTY: Record<Filter, { icon: typeof Info; title: string; body: string }> = {
  all:      { icon: BellOff,    title: "You're all caught up", body: 'New alerts, to-dos and account activity will show up here.' },
  action:   { icon: ListChecks, title: 'Nothing needs your attention', body: "We'll flag expiring consents, missing nominees and anything else that needs you." },
  activity: { icon: History,    title: 'No recent activity', body: 'Sign-ins, consent changes and data syncs from the last 30 days appear here.' },
};

function useIsNarrow() {
  const query = '(max-width: 639px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

function relativeTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const d = new Date(t);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}) });
}

function groupLabel(iso: string, now: number): 'Today' | 'This week' | 'Earlier' {
  const d = new Date(iso);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return 'Today';
  return now - d.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'This week' : 'Earlier';
}

/** Navigate in-app; for "/path#section" also bring the section into view once it renders. */
function useDeepLink() {
  const navigate = useNavigate();
  return useCallback((url: string) => {
    if (!url.startsWith('/') || url.startsWith('//')) return;
    const [path, hash] = url.split('#');
    navigate(path);
    if (!hash) return;
    const started = Date.now();
    const tryScroll = () => {
      const el = document.getElementById(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (Date.now() - started < 3000) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  }, [navigate]);
}

export default function NotificationCenter() {
  const userId = useAssetStore(s => s.user?.id) ?? null;
  const {
    feed: storedFeed, ownerId, loading, error: storedError, lastFetchedAt, fetch, markRead, markAllRead, dismiss, reset,
  } = useNotificationStore();
  // Only ever render a feed fetched for the signed-in user — never a previous account's items
  const feed = storedFeed && ownerId === userId ? storedFeed : null;
  const error = storedFeed && ownerId !== userId ? null : storedError;
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const narrow = useIsNarrow();
  const goTo = useDeepLink();

  // On mount and whenever the user changes: drop anything that belongs to someone else, then fetch
  useEffect(() => {
    if (useNotificationStore.getState().ownerId !== userId) reset();
    void fetch();
  }, [userId, fetch, reset]);

  // Poll every minute while the tab is visible; refresh on focus / when the tab comes back
  useEffect(() => {
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - useNotificationStore.getState().lastFetchedAt > FOCUS_REFRESH_AFTER_MS) void fetch();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetch();
    }, POLL_MS);
    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', refreshIfStale);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', refreshIfStale);
    };
  }, [fetch]);

  // Opening the panel refreshes anything older than a few seconds
  useEffect(() => {
    if (open && Date.now() - lastFetchedAt > FOCUS_REFRESH_AFTER_MS) void fetch();
  }, [open, lastFetchedAt, fetch]);

  const unread = feed?.unreadCount ?? 0;
  const badge = unread > 9 ? '9+' : String(unread);

  const onMarkRead = useCallback((id: string) => {
    markRead(id).catch(err => toast.error(userFacingMessage(err)));
  }, [markRead]);

  const onDismiss = useCallback((item: NotificationItem) => {
    dismiss(item.id)
      .then(() => toast.success('Dismissed', { description: item.title }))
      .catch(err => toast.error(userFacingMessage(err)));
  }, [dismiss]);

  const onAction = useCallback((item: NotificationItem) => {
    if (!item.actionUrl) return;
    if (!item.read) onMarkRead(item.id);
    setOpen(false);
    goTo(item.actionUrl);
  }, [goTo, onMarkRead]);

  const onMarkAll = async () => {
    setMarkingAll(true);
    try { await markAllRead(); }
    catch (err) { toast.error(userFacingMessage(err)); }
    finally { setMarkingAll(false); }
  };

  const trigger = (
    <button
      type="button"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={narrow ? () => setOpen(true) : undefined}
      className="relative size-10 rounded-full bg-white dark:bg-white/10 grid place-items-center shadow-sm hover:bg-zinc-100 dark:hover:bg-white/15 active:scale-95 transition text-zinc-900 dark:text-zinc-100 border border-transparent dark:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="size-4" strokeWidth={1.75} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-5 text-center ring-2 ring-white dark:ring-zinc-900 tabular-nums"
        >
          {badge}
        </span>
      )}
    </button>
  );

  const panel = (
    <NotificationPanel
      filter={filter}
      onFilter={setFilter}
      onMarkAll={onMarkAll}
      markingAll={markingAll}
      onMarkRead={onMarkRead}
      onDismiss={onDismiss}
      onAction={onAction}
      onRetry={() => void fetch()}
      feed={feed}
      loading={loading}
      error={error}
      narrow={narrow}
    />
  );

  if (narrow) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="p-0 gap-0 rounded-t-2xl max-h-[88vh] flex flex-col bg-card text-foreground border-border">
            <SheetTitle className="sr-only">Notifications</SheetTitle>
            <SheetDescription className="sr-only">Alerts, things that need your attention and recent account activity.</SheetDescription>
            {panel}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        aria-label="Notifications"
        className="w-[24rem] p-0 rounded-2xl overflow-hidden bg-card text-foreground border-border shadow-xl flex flex-col max-h-[min(36rem,calc(100vh-6rem))]"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

interface PanelProps {
  feed: ReturnType<typeof useNotificationStore.getState>['feed'];
  loading: boolean;
  error: unknown;
  filter: Filter;
  narrow: boolean;
  markingAll: boolean;
  onFilter: (f: Filter) => void;
  onMarkAll: () => void;
  onMarkRead: (id: string) => void;
  onDismiss: (item: NotificationItem) => void;
  onAction: (item: NotificationItem) => void;
  onRetry: () => void;
}

function NotificationPanel({
  feed, loading, error, filter, narrow, markingAll, onFilter, onMarkAll, onMarkRead, onDismiss, onAction, onRetry,
}: PanelProps) {
  const items = useMemo(() => feed?.items ?? [], [feed]);
  const actionItems = useMemo(() => items.filter(needsAction), [items]);
  const activityItems = useMemo(() => items.filter(i => i.kind === 'activity'), [items]);
  const visible = filter === 'action' ? actionItems : filter === 'activity' ? activityItems : items;
  const unread = feed?.unreadCount ?? 0;
  const actionUnread = actionItems.filter(i => !i.read).length;

  // Re-render relative times each minute while open
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [feed]);

  const groups = useMemo(() => {
    const out: Array<{ label: string; items: NotificationItem[] }> = [];
    // Live to-dos are current conditions, not events: pin them above alerts and activity,
    // unread first, then most severe, then newest
    const todos = filter === 'activity' ? [] : visible.filter(i => i.kind === 'action');
    if (todos.length) {
      out.push({
        label: 'To do',
        items: [...todos].sort((a, b) =>
          Number(a.read) - Number(b.read)
          || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
          || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      });
    }
    // Everything else in time order (the feed arrives newest first)
    for (const item of visible) {
      if (item.kind === 'action' && filter !== 'activity') continue;
      const label = groupLabel(item.createdAt, now);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }, [visible, filter, now]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className={cn('flex items-center justify-between gap-3 px-4 pt-4 pb-3', narrow && 'pr-12')}>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feed ? (unread > 0 ? `${unread} unread` : 'No unread notifications') : loading ? 'Loading…' : ' '}
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAll}
          disabled={!feed || unread === 0 || markingAll}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CheckCheck className="size-3.5" aria-hidden="true" />
          Mark all as read
        </button>
      </div>

      <Tabs value={filter} onValueChange={(v) => onFilter(v as Filter)} className="px-4 pb-2">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="all" className="text-xs h-6">All</TabsTrigger>
          <TabsTrigger value="action" className="text-xs h-6 gap-1">
            Needs action
            {actionUnread > 0 && (
              <span className="rounded-full bg-rose-500 text-white text-[10px] leading-4 min-w-[1rem] px-1 tabular-nums" aria-label={`${actionUnread} unread`}>
                {actionUnread > 9 ? '9+' : actionUnread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs h-6">Activity</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border-t border-border" />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" role="region" aria-label={`${filter === 'all' ? 'All' : filter === 'action' ? 'Needs action' : 'Activity'} notifications`}>
        {!feed && loading ? (
          <ListSkeleton />
        ) : !feed && error ? (
          <div className="p-4">
            <ErrorCard error={error} title="We couldn't load your notifications" onRetry={onRetry} isRetrying={loading} compact />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div>
            {groups.map(g => (
              <section key={g.label} aria-label={g.label}>
                <h3 className="sticky top-0 z-10 bg-card/95 backdrop-blur px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </h3>
                <ul className="divide-y divide-border/60">
                  {g.items.map(item => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      now={now}
                      onMarkRead={onMarkRead}
                      onDismiss={onDismiss}
                      onAction={onAction}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {feed && (error || feed.degraded.length > 0) ? (
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          {error ? "Couldn't refresh just now — showing the last update." : 'Some checks are unavailable right now, so this list may be incomplete.'}
        </p>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, now, onMarkRead, onDismiss, onAction }: {
  item: NotificationItem;
  now: number;
  onMarkRead: (id: string) => void;
  onDismiss: (item: NotificationItem) => void;
  onAction: (item: NotificationItem) => void;
}) {
  const sev = SEVERITY[item.severity] ?? SEVERITY.info;
  const Icon = sev.icon;
  const compact = item.kind === 'activity';
  const hasAction = !!(item.actionUrl && item.actionLabel);

  const content = (
    <>
      <span className="flex items-start gap-2">
        <span className={cn('text-sm leading-snug text-foreground break-words', item.read ? 'font-medium' : 'font-semibold')}>
          <span className="sr-only">{item.read ? '' : 'Unread. '}{sev.label}: </span>
          {item.title}
        </span>
        {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />}
      </span>
      {item.body && (
        <span className={cn('mt-0.5 block text-xs leading-relaxed text-muted-foreground break-words', compact ? 'line-clamp-2' : 'line-clamp-3')}>{item.body}</span>
      )}
      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {item.ongoing ? (
          <span title="This stays here until it's resolved">Ongoing</span>
        ) : (
          <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString('en-IN')}>{relativeTime(item.createdAt, now)}</time>
        )}
        {item.count && item.count > 1 ? <span className="rounded bg-muted px-1 tabular-nums">×{item.count}</span> : null}
      </span>
    </>
  );

  const rowFocus = 'block w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <li className={cn('relative flex gap-3 px-4 transition-colors', compact ? 'py-2.5' : 'py-3', !item.read && 'bg-muted/50')}>
      <span className={cn('shrink-0 rounded-full grid place-items-center', compact ? 'mt-0.5 ml-1 size-6' : 'mt-0.5 size-8', sev.tone)} aria-hidden="true">
        <Icon className={compact ? 'size-3.5' : 'size-4'} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        {hasAction ? (
          // The whole item opens its target (and marks it read): one focus stop per item
          <button type="button" onClick={() => onAction(item)} className={cn(rowFocus, 'group')}>
            {content}
            <span className="mt-2 inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-sm group-hover:bg-muted">
              {item.actionLabel}
            </span>
          </button>
        ) : !item.read ? (
          <button type="button" onClick={() => onMarkRead(item.id)} className={rowFocus}>
            {content}
            <span className="sr-only">. Mark as read</span>
          </button>
        ) : (
          // Read and nothing to open: plain text, not a focus stop that does nothing
          <div className="block w-full">{content}</div>
        )}
      </div>

      {item.dismissible && (
        <button
          type="button"
          onClick={() => onDismiss(item)}
          aria-label={`Dismiss: ${item.title}`}
          title="Dismiss"
          className="size-7 shrink-0 -mr-1 rounded-md grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const e = EMPTY[filter];
  const Icon = e.icon;
  return (
    <div className="px-6 py-10 text-center">
      <span className="mx-auto mb-3 size-10 rounded-full bg-muted grid place-items-center text-muted-foreground" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{e.title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[18rem] mx-auto">{e.body}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="px-4 py-3 space-y-4" aria-busy="true" aria-label="Loading notifications">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton width={32} height={32} radius={999} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={12} />
            <Skeleton width="95%" height={10} />
            <Skeleton width="30%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
