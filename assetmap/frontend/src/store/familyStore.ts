import { create } from 'zustand';
import { api } from '../services/api';
import { AppError } from '../errors/AppError';

// ─────────────────────────────────────────────────────
// Family Vault store — one owner plus invited members.
// Everyone in the vault (owner or member) reads the same vault via /family/vault.
// ─────────────────────────────────────────────────────

export type MemberStatus = 'invited' | 'expired' | 'active' | 'paused';

export interface SharingPrefs {
  shareBankAccounts: boolean;
  shareFixedDeposits: boolean;
  shareMutualFunds: boolean;
  shareEquity: boolean;
  shareNps: boolean;
  shareEpf: boolean;
  shareInsurance: boolean;
  shareLand: boolean;
  shareGold: boolean;
  shareTotalNetworth: boolean;
}

export interface Member extends SharingPrefs {
  id: string;
  userId: string | null;
  displayName: string;
  customName: string | null;
  relationship: string;
  role: 'owner' | 'member';
  status: MemberStatus;
  isYou: boolean;
  avatarColor: string;
  mobileHint: string | null;
  acceptedAt: string | null;
  invitedAt: string;
  expiresAt: string | null;
}

export interface Vault {
  id: string;
  vault_name: string;
  max_members: number;
  primary_user_id: string;
  created_at: string;
  seatsUsed: number;
  viewer: { userId: string; memberId: string; isOwner: boolean };
  members: Member[];
}

export interface MemberSummary {
  memberId: string;
  userId: string;
  name: string;
  avatarColor: string;
  relationship: string;
  totalPaise: number;
  byAssetClass: Record<string, number>;
  sharesNothing: boolean;
}

export interface NetWorth {
  totalPaise: number;
  members: MemberSummary[];
  byAssetClass: Record<string, number>;
  memberCount: number;
}

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  goalType: string;
  emoji: string;
  status: 'active' | 'completed';
  targetAmountPaise: number;
  currentAmountPaise: number;
  remainingPaise: number;
  progressPct: number;
  targetDate: string | null;
  createdAt: string;
  createdBy: string;
  canCancel: boolean;
  contributionCount: number;
  contributions: { amountPaise: number; note: string | null; at: string; by: string; isYou: boolean }[];
}

export interface EstateMember {
  memberId: string;
  userId: string;
  name: string;
  avatarColor: string;
  nomineePct: number;
  hasWill: boolean;
  willStatus: string | null;
  estateScore: number;
  totalAccounts: number;
  accountsWithNominee: number;
}

export interface Activity {
  id: string;
  activityType: string;
  title: string;
  body: string | null;
  createdAt: string;
  isYou: boolean;
  userName: string | null;
}

export interface Invitation {
  inviteId: string;
  vaultName: string;
  inviterName: string;
  relationship: string;
  invitedAt: string;
  expiresAt: string;
  blockedReason?: string | null;
  replacesOwnVault?: boolean;
}

export interface MemberAssets {
  member: { id: string; name: string; avatarColor: string; relationship: string; sharedClasses: string[] };
  assets: { id: string; asset_class: string; institution_name: string; source: string | null; current_value_paise: number; has_nominee: boolean | null; last_synced_at: string }[];
  summary: Record<string, number>;
  sharesNothing: boolean;
}

interface FamilyStore {
  vault: Vault | null;
  isLoading: boolean;      // first load of the vault
  loadError: unknown;      // vault fetch failed for a reason other than "no vault" (404)
  netWorth: NetWorth | null;
  history: { month: string; totalPaise: number; members: Record<string, number> }[];
  goals: Goal[];
  estate: { overallScore: number; members: EstateMember[] } | null;
  activities: Activity[];
  invitations: Invitation[];
  detailsLoading: boolean;

  fetchVault: () => Promise<void>;
  fetchDetails: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  refreshAll: () => Promise<void>;

  createVault: (name: string) => Promise<void>;
  closeVault: () => Promise<void>;
  inviteMember: (mobile: string, name: string, relationship: string) => Promise<{ smsSent: boolean; mobileHint: string }>;
  resendInvite: (memberId: string) => Promise<{ smsSent: boolean }>;
  removeMember: (memberId: string) => Promise<void>;
  leaveVault: () => Promise<void>;
  updateVisibility: (prefs: Partial<SharingPrefs> & { displayName?: string }) => Promise<void>;

  previewInvite: (by: { inviteId?: string; token?: string }) => Promise<Invitation>;
  acceptInvite: (by: { inviteId?: string; token?: string }) => Promise<{ vaultId: string; primaryUserName: string }>;
  declineInvite: (inviteId: string) => Promise<void>;

  fetchMemberAssets: (memberId: string) => Promise<MemberAssets>;
  createGoal: (goal: { name: string; goalType: string; targetAmountPaise: number; targetDate?: string | null; description?: string; emoji?: string }) => Promise<void>;
  contribute: (goalId: string, amountPaise: number, note?: string) => Promise<{ completed: boolean }>;
  cancelGoal: (goalId: string) => Promise<void>;
  reset: () => void;
}

/** The backend's user-safe message for family business errors; AppError copy otherwise. */
export function familyErrorMessage(err: unknown, fallback: string): string {
  const fromBody = (err as any)?.response?.data?.error?.message;
  if (typeof fromBody === 'string' && fromBody.length < 220) return fromBody;
  if (err instanceof AppError) return err.userMessage;
  return fallback;
}

const unwrap = <T,>(res: any): T => res?.data?.data as T;

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  vault: null,
  isLoading: false,
  loadError: null,
  netWorth: null,
  history: [],
  goals: [],
  estate: null,
  activities: [],
  invitations: [],
  detailsLoading: false,

  fetchVault: async () => {
    if (!get().vault) set({ isLoading: true });
    set({ loadError: null });
    try {
      const res = await api.get('/family/vault');
      set({ vault: unwrap<Vault>(res), isLoading: false });
    } catch (err: any) {
      // 404 = genuinely no vault. Anything else (network, 5xx) must not be read as "no vault",
      // or the page would offer to create a second one.
      const noVault = err?.response?.status === 404;
      set({
        vault: noVault ? null : get().vault,
        isLoading: false,
        loadError: noVault ? null : err,
        ...(noVault ? { netWorth: null, history: [], goals: [], estate: null, activities: [] } : {}),
      });
    }
  },

  fetchDetails: async () => {
    const { vault } = get();
    if (!vault) return;
    set({ detailsLoading: true });
    const base = `/family/vault/${vault.id}`;
    const [nw, hist, goals, estate, activity] = await Promise.allSettled([
      api.get(`${base}/networth`),
      api.get(`${base}/history?months=12`),
      api.get(`${base}/goals`),
      api.get(`${base}/estate`),
      api.get(`${base}/activity`),
    ]);
    // Each panel degrades on its own; one failing call must not blank the page
    set({
      netWorth:   nw.status === 'fulfilled' ? unwrap<NetWorth>(nw.value) : get().netWorth,
      history:    hist.status === 'fulfilled' ? unwrap(hist.value) ?? [] : get().history,
      goals:      goals.status === 'fulfilled' ? unwrap(goals.value) ?? [] : get().goals,
      estate:     estate.status === 'fulfilled' ? unwrap(estate.value) : get().estate,
      activities: activity.status === 'fulfilled' ? unwrap(activity.value) ?? [] : get().activities,
      detailsLoading: false,
    });
  },

  fetchInvitations: async () => {
    try {
      const res = await api.get('/family/invitations');
      set({ invitations: unwrap<Invitation[]>(res) ?? [] });
    } catch {
      // The inbox is a convenience; a failed fetch shouldn't block the page
    }
  },

  refreshAll: async () => {
    await get().fetchVault();
    await Promise.all([get().fetchDetails(), get().fetchInvitations()]);
  },

  createVault: async (name) => {
    try {
      await api.post('/family/vault', { vaultName: name });
      await get().refreshAll();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't create your family vault. Please try again."));
    }
  },

  closeVault: async () => {
    try {
      await api.delete('/family/vault');
      get().reset();
      await get().fetchInvitations();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't close the vault. Please try again."));
    }
  },

  inviteMember: async (mobile, name, relationship) => {
    try {
      const res = await api.post('/family/invite', { mobile, name, relationship });
      await get().refreshAll();
      return unwrap(res);
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't send the invitation. Please try again."));
    }
  },

  resendInvite: async (memberId) => {
    try {
      const res = await api.post(`/family/members/${memberId}/resend`);
      await get().fetchVault();
      return unwrap(res);
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't resend the invitation. Please try again."));
    }
  },

  removeMember: async (memberId) => {
    try {
      await api.delete(`/family/members/${memberId}`);
      await get().refreshAll();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't remove this member. Please try again."));
    }
  },

  leaveVault: async () => {
    try {
      await api.post('/family/leave');
      get().reset();
      await get().fetchInvitations();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't leave the vault. Please try again."));
    }
  },

  updateVisibility: async (prefs) => {
    try {
      await api.patch('/family/visibility', prefs);
      await get().refreshAll();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't save your sharing settings. Please try again."));
    }
  },

  previewInvite: async (by) => {
    try {
      const res = by.token
        ? await api.post('/family/join/preview', { token: by.token })
        : await api.post(`/family/invitations/${by.inviteId}/preview`);
      return unwrap(res);
    } catch (err) {
      throw new Error(familyErrorMessage(err, 'This invitation is no longer valid.'));
    }
  },

  acceptInvite: async (by) => {
    try {
      const res = by.token
        ? await api.post('/family/join', { token: by.token })
        : await api.post(`/family/invitations/${by.inviteId}/accept`);
      await get().refreshAll();
      return unwrap(res);
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't join this vault. Please try again."));
    }
  },

  declineInvite: async (inviteId) => {
    try {
      await api.post(`/family/invitations/${inviteId}/decline`);
      set({ invitations: get().invitations.filter(i => i.inviteId !== inviteId) });
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't decline this invitation. Please try again."));
    }
  },

  fetchMemberAssets: async (memberId) => {
    const { vault } = get();
    if (!vault) throw new Error('No family vault');
    const res = await api.get(`/family/vault/${vault.id}/members/${memberId}/assets`);
    return unwrap(res);
  },

  createGoal: async (goal) => {
    const { vault } = get();
    if (!vault) return;
    try {
      await api.post(`/family/vault/${vault.id}/goals`, goal);
      await get().fetchDetails();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't create the goal. Please try again."));
    }
  },

  contribute: async (goalId, amountPaise, note) => {
    const { vault } = get();
    if (!vault) throw new Error('No family vault');
    try {
      const res = await api.post(`/family/vault/${vault.id}/goals/${goalId}/contributions`, { amountPaise, ...(note ? { note } : {}) });
      await get().fetchDetails();
      return unwrap(res);
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't record the contribution. Please try again."));
    }
  },

  cancelGoal: async (goalId) => {
    const { vault } = get();
    if (!vault) return;
    try {
      await api.delete(`/family/vault/${vault.id}/goals/${goalId}`);
      await get().fetchDetails();
    } catch (err) {
      throw new Error(familyErrorMessage(err, "We couldn't remove the goal. Please try again."));
    }
  },

  reset: () => set({ vault: null, netWorth: null, history: [], goals: [], estate: null, activities: [], loadError: null }),
}));
