import { create } from 'zustand';
import { api } from '../services/api';
import { useAssetStore } from './assetStore';

/* In-app notification center state (GET /api/notifications).
   Every list item comes from the backend — nothing is generated client-side.
   The feed is tagged with the user it was fetched for and cleared whenever the
   signed-in user changes (logout, account switch), so one account never sees
   another's items in the same tab. */

export type NotificationKind = 'alert' | 'action' | 'activity';
export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  source: string;
  dismissible: boolean;
  count?: number;
  /** A standing condition with no event date (e.g. no will yet). */
  ongoing?: boolean;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
  counts: { all: number; action: number; alert: number; activity: number };
  degraded: string[];
  generatedAt: string;
}

interface NotificationState {
  feed: NotificationFeed | null;
  /** The user `feed` belongs to; the UI only renders the feed when this matches the signed-in user. */
  ownerId: string | null;
  loading: boolean;
  error: unknown;
  lastFetchedAt: number;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  reset: () => void;
}

const withItems = (feed: NotificationFeed, items: NotificationItem[]): NotificationFeed => ({
  ...feed,
  items,
  unreadCount: items.filter(i => !i.read).length,
  counts: {
    all: items.length,
    action: items.filter(i => i.kind === 'action').length,
    alert: items.filter(i => i.kind === 'alert').length,
    activity: items.filter(i => i.kind === 'activity').length,
  },
});

/** Items for the "Needs action" filter: live to-dos plus unresolved warnings. */
export const needsAction = (i: NotificationItem) =>
  i.kind === 'action' || (i.kind === 'alert' && (i.severity === 'critical' || i.severity === 'warning'));

/** The item no longer exists on the server (e.g. a regenerated spend insight). */
function isGone(err: unknown): boolean {
  const e = err as { statusCode?: number | null; code?: string } | null;
  return e?.statusCode === 404 || e?.code === 'NOTIFICATION_NOT_FOUND';
}

const currentUserId = () => useAssetStore.getState().user?.id ?? null;

let inflight: Promise<void> | null = null;
// Bumped by every mutation so a poll that started earlier can't overwrite an optimistic update
let mutationSeq = 0;
let fetchToken: object | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => {
  /** Fetch after any request already in flight (whose result a mutation has made stale). */
  const refetchQuietly = () => {
    const run = () => get().fetch().catch(() => undefined);
    void (inflight ? inflight.then(run) : run());
  };

  /** Drop an item the server no longer has, then quietly pick up the current feed. */
  const dropGone = (id: string) => {
    const feed = get().feed;
    if (feed) set({ feed: withItems(feed, feed.items.filter(i => i.id !== id)) });
    refetchQuietly();
  };

  return {
    feed: null,
    ownerId: null,
    loading: false,
    error: null,
    lastFetchedAt: 0,

    fetch: () => {
      if (inflight) return inflight;
      set({ loading: true });
      const seq = mutationSeq;
      const owner = currentUserId();
      const token = {};
      fetchToken = token;
      inflight = (async () => {
        try {
          const res = await api.get('/notifications');
          // Discard a response for a user who has since signed out or switched accounts
          if (seq === mutationSeq && owner === currentUserId()) {
            set({ feed: res.data?.data ?? null, ownerId: owner, error: null, lastFetchedAt: Date.now() });
          }
        } catch (err) {
          if (seq === mutationSeq && owner === currentUserId()) set({ error: err });
        } finally {
          if (fetchToken === token) {
            inflight = null;
            fetchToken = null;
            set({ loading: false });
          }
        }
      })();
      return inflight;
    },

    // Optimistic. A 404 means the item is gone: drop it quietly. Any other failure puts the
    // item back as unread and re-throws for a toast.
    markRead: async (id) => {
      const prev = get().feed;
      if (!prev) return;
      const target = prev.items.find(i => i.id === id);
      if (!target || target.read) return;
      mutationSeq++;
      set({ feed: withItems(prev, prev.items.map(i => (i.id === id ? { ...i, read: true } : i))) });
      try {
        await api.post(`/notifications/${encodeURIComponent(id)}/read`);
      } catch (err) {
        if (isGone(err)) { dropGone(id); return; }
        const cur = get().feed;
        if (cur) set({ feed: withItems(cur, cur.items.map(i => (i.id === id ? { ...i, read: false } : i))) });
        throw err;
      }
    },

    markAllRead: async () => {
      const prev = get().feed;
      if (!prev) return;
      mutationSeq++;
      set({ feed: withItems(prev, prev.items.map(i => ({ ...i, read: true }))) });
      try {
        const res = await api.post('/notifications/read-all');
        if (res.data?.data) set({ feed: res.data.data, lastFetchedAt: Date.now() });
      } catch (err) {
        set({ feed: prev });
        throw err;
      }
    },

    dismiss: async (id) => {
      const prev = get().feed;
      if (!prev) return;
      const index = prev.items.findIndex(i => i.id === id);
      if (index < 0) return;
      const target = prev.items[index];
      mutationSeq++;
      set({ feed: withItems(prev, prev.items.filter(i => i.id !== id)) });
      try {
        await api.post(`/notifications/${encodeURIComponent(id)}/dismiss`);
      } catch (err) {
        if (isGone(err)) { dropGone(id); return; }
        const cur = get().feed;
        if (cur && !cur.items.some(i => i.id === id)) {
          const items = [...cur.items];
          items.splice(Math.min(index, items.length), 0, target);
          set({ feed: withItems(cur, items) });
        }
        throw err;
      }
    },

    reset: () => {
      mutationSeq++;
      inflight = null;
      fetchToken = null;
      set({ feed: null, ownerId: null, loading: false, error: null, lastFetchedAt: 0 });
    },
  };
});

// Sign-out or a different account signing in (no page reload in the SPA) → forget the old feed
useAssetStore.subscribe((state, prev) => {
  if ((state.user?.id ?? null) !== (prev.user?.id ?? null)) useNotificationStore.getState().reset();
});
