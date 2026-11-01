import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, ShieldCheck, LineChart, Lock, Sparkles, ArrowRight, SlidersHorizontal, UserPlus, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useFamilyStore, type Member } from '../../store/familyStore';
import { usePlanStore } from '../../store/planStore';
import FamilyNetWorth from './FamilyNetWorth';
import FamilyMemberCard from './FamilyMemberCard';
import InviteMember from './InviteMember';
import FamilyGoals from './FamilyGoals';
import FamilyEstateScore from './FamilyEstateScore';
import FamilyActivity from './FamilyActivity';
import FamilyInvitations from './FamilyInvitations';
import SharingSettings from './SharingSettings';
import MemberAssetsSheet from './MemberAssetsSheet';
import { CardSkeleton } from '../loading/CardSkeleton';
import { ChartSkeleton } from '../loading/ChartSkeleton';
import { ErrorCard } from '../errors/ErrorCard';
import { cardClass } from './familyUi';

const PILLARS = [
  { icon: LineChart, tone: 'bg-lime-100 dark:bg-lime-950/60 text-lime-700 dark:text-lime-400', title: 'One family net worth', body: 'See everyone’s shared balances — bank, mutual funds, property — in one total.' },
  { icon: ShieldCheck, tone: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400', title: 'Estate readiness', body: 'Spot missing nominees and wills across the family before they become a problem.' },
  { icon: Lock, tone: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400', title: 'Each member decides', body: 'Members choose which asset types to share. Account numbers are never shown.' },
];

const STEPS = [
  { n: 1, title: 'Create your vault', body: 'Included with Pro. You become the owner.' },
  { n: 2, title: 'Invite by mobile', body: 'Up to 3 family members. They sign in with that number.' },
  { n: 3, title: 'They accept & choose', body: 'No Pro needed to join. They pick what to share.' },
];

export default function FamilyVaultPage() {
  const { vault, isLoading, loadError, netWorth, invitations, refreshAll, fetchVault, fetchDetails, createVault } = useFamilyStore();
  const { planStatus, hasFeature } = usePlanStore();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [openMember, setOpenMember] = useState<Member | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  // Other family members act independently — pick up their changes when the user comes back to the tab
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshAll]);

  const canCreate = !planStatus || hasFeature('family_vault');

  const handleCreateVault = async () => {
    if (!canCreate) { navigate('/pricing'); return; }
    setIsCreating(true);
    try {
      await createVault('My Family');
      toast.success('Family vault created. Invite your family next.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchVault();
    await fetchDetails();
    setRefreshing(false);
  };

  // Skeleton only for the first load; refetches keep the vault on screen
  if (isLoading && !vault) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading family vault" className="w-full space-y-6">
        <div className="h-10 w-64 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <CardSkeleton rows={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <CardSkeleton rows={2} /><CardSkeleton rows={2} /><CardSkeleton rows={2} />
        </div>
      </div>
    );
  }

  if (!vault && loadError) {
    return (
      <div className="w-full max-w-[56rem] mx-auto py-6">
        <ErrorCard error={loadError} title="We couldn't load your family vault" onRetry={() => { void refreshAll(); }} />
      </div>
    );
  }

  // ── No vault yet: pending invitations first, then the intro
  if (!vault) {
    return (
      <div className="w-full max-w-[60rem] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <FamilyInvitations />

        <div className={`${cardClass} relative overflow-hidden p-6 sm:p-10`}>
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-72 bg-gradient-to-br from-lime-400/20 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/40 bg-lime-500/10 px-3.5 py-1.5 text-xs font-semibold text-lime-700 dark:text-lime-400">
              <Sparkles className="size-3.5" />
              Family Vault
            </div>
            <div className="mx-auto mt-5 size-14 rounded-2xl bg-zinc-900 dark:bg-white grid place-items-center shadow-md">
              <Users className="size-7 text-lime-300 dark:text-zinc-900" />
            </div>
            <h2 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">
              Your family’s finances, together
            </h2>
            <p className="mx-auto mt-3 max-w-[36rem] text-sm sm:text-base text-muted-foreground text-balance">
              Bring up to 4 people into one private space to see a combined net worth, close estate gaps and save for shared goals — while everyone keeps control of what they share.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILLARS.map(p => (
              <div key={p.title} className="rounded-2xl border border-border bg-muted/40 p-5">
                <div className={`size-9 rounded-xl grid place-items-center ${p.tone}`}><p.icon className="size-5" /></div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>

          <ol className="relative mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map(s => (
              <li key={s.n} className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-foreground text-background text-xs font-semibold grid place-items-center">{s.n}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="relative mt-8 flex flex-col items-center gap-3">
            <button
              onClick={handleCreateVault}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:shadow-none dark:hover:bg-zinc-100"
            >
              {isCreating ? <><Loader2 className="size-4 animate-spin" /> Creating vault…</>
                : canCreate ? <>Create family vault <ArrowRight className="size-4" /></>
                : <><Crown className="size-4" /> Upgrade to Pro to create a vault</>}
            </button>
            <p className="text-xs text-muted-foreground text-center text-balance">
              {invitations.length === 0
                ? 'Expecting an invitation? Ask your family member to invite the mobile number you sign in with — it will appear right here.'
                : 'Or accept an invitation above — joining doesn’t need Pro.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = vault.viewer.isOwner;
  const owner = vault.members.find(m => m.role === 'owner');
  const activeCount = vault.members.filter(m => m.status === 'active').length;
  const seatsLeft = Math.max(0, vault.max_members - vault.seatsUsed);
  const summaryFor = (m: Member) => netWorth?.members.find(s => s.memberId === m.id);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground flex items-center gap-3">
            <Users className="size-7 shrink-0" />
            <span className="truncate">{vault.vault_name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOwner
              ? `You manage this vault · ${activeCount} active member${activeCount === 1 ? '' : 's'}`
              : `Managed by ${owner?.displayName ?? 'the owner'} · ${activeCount} active member${activeCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-xs font-medium text-muted-foreground" title="Members and pending invites">
            {vault.seatsUsed} / {vault.max_members} members
          </span>
          <button
            type="button"
            onClick={() => void manualRefresh()}
            disabled={refreshing}
            className="size-10 rounded-full border border-border bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-60"
            aria-label="Refresh family vault"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setSharingOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="size-4" />
            {isOwner ? 'Settings' : 'What I share'}
          </button>
          <InviteMember vault={vault} />
        </div>
      </div>

      <FamilyInvitations />

      {/* Wealth + protection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2"><FamilyNetWorth /></div>
        <FamilyEstateScore />
      </div>

      {/* Members */}
      <section aria-labelledby="family-members-title">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 id="family-members-title" className="text-base font-semibold text-foreground">Family members</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">Select a member to see what they share</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {vault.members.map(member => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              summary={summaryFor(member)}
              viewerIsOwner={isOwner}
              onOpen={setOpenMember}
            />
          ))}
          {isOwner && seatsLeft > 0 && (
            <InviteMember
              vault={vault}
              trigger={
                <div className="h-full min-h-[10rem] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 p-5 text-center text-muted-foreground transition-colors hover:border-zinc-400 hover:text-foreground dark:hover:border-zinc-500">
                  <div className="size-10 rounded-xl bg-muted grid place-items-center"><UserPlus className="size-5" /></div>
                  <p className="text-sm font-semibold">Invite a family member</p>
                  <p className="text-xs">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</p>
                </div>
              }
            />
          )}
        </div>
      </section>

      {/* Goals + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2"><FamilyGoals /></div>
        <FamilyActivity />
      </div>

      <SharingSettings vault={vault} open={sharingOpen} onOpenChange={setSharingOpen} />
      <MemberAssetsSheet member={openMember} onClose={() => setOpenMember(null)} />
    </div>
  );
}
