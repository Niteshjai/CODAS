import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Users, ShieldCheck, EyeOff } from 'lucide-react';
import { useFamilyStore, type Invitation } from '../../store/familyStore';
import { daysUntil, relationshipLabel } from './familyUi';

type State =
  | { kind: 'loading' }
  | { kind: 'preview'; invite: Invitation }
  | { kind: 'joining'; invite: Invitation }
  | { kind: 'joined'; ownerName: string }
  | { kind: 'declined' }
  | { kind: 'error'; message: string };

export default function FamilyJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { previewInvite, acceptInvite, declineInvite } = useFamilyStore();
  const [state, setState] = useState<State>({ kind: 'loading' });
  // The token is a one-time credential: read it once, then drop it from the address bar/history
  const tokenRef = useRef<string | null>(searchParams.get('token'));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;       // StrictMode runs effects twice; preview once
    started.current = true;
    window.history.replaceState(null, '', '/family/join');

    const token = tokenRef.current;
    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      setState({ kind: 'error', message: 'This invitation link is incomplete. Open the full link from the SMS, or check Family Vault for pending invitations.' });
      return;
    }
    previewInvite({ token })
      .then(invite => setState({ kind: 'preview', invite }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  }, [previewInvite]);

  const accept = async (invite: Invitation) => {
    setState({ kind: 'joining', invite });
    try {
      const res = await acceptInvite({ token: tokenRef.current! });
      setState({ kind: 'joined', ownerName: res.primaryUserName });
    } catch (err: any) {
      setState({ kind: 'error', message: err.message });
    }
  };

  const decline = async (invite: Invitation) => {
    setState({ kind: 'joining', invite });
    try {
      await declineInvite(invite.inviteId);
      setState({ kind: 'declined' });
    } catch (err: any) {
      setState({ kind: 'error', message: err.message });
    }
  };

  const goToVault = () => navigate('/dashboard?tab=family');

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[28rem] rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {state.kind === 'loading' && (
          <div className="flex flex-col items-center py-6 text-center" role="status">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Checking your invitation…</p>
          </div>
        )}

        {(state.kind === 'preview' || state.kind === 'joining') && (() => {
          const inv = state.invite;
          const blocked = inv.blockedReason;
          const busy = state.kind === 'joining';
          return (
            <div>
              <div className="mx-auto size-14 rounded-2xl bg-zinc-900 dark:bg-white grid place-items-center">
                <Users className="size-7 text-lime-300 dark:text-zinc-900" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-foreground text-center text-balance">
                {inv.inviterName} invited you to their family vault
              </h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                “{inv.vaultName}” · as their {relationshipLabel(inv.relationship).toLowerCase()} · expires in {daysUntil(inv.expiresAt)} day{daysUntil(inv.expiresAt) === 1 ? '' : 's'}
              </p>

              <ul className="mt-6 space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                <li className="flex gap-3 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />You'll see the family's combined net worth, shared goals and estate readiness.</li>
                <li className="flex gap-3 text-xs text-muted-foreground"><EyeOff className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />You choose which of your asset types to share — and can change or leave anytime. Account numbers are never shown.</li>
              </ul>

              {blocked ? (
                <div role="alert" className="mt-5 rounded-xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                  {blocked}
                </div>
              ) : inv.replacesOwnVault ? (
                <p className="mt-5 text-xs text-muted-foreground text-center">
                  You can be in one vault at a time — joining closes your own empty vault.
                </p>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => void decline(inv)} disabled={busy} className="h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">
                  Decline
                </button>
                {blocked ? (
                  <button type="button" onClick={goToVault} className="h-11 rounded-xl bg-foreground text-sm font-semibold text-background hover:opacity-90">
                    Open my vault
                  </button>
                ) : (
                  <button type="button" onClick={() => void accept(inv)} disabled={busy} className="h-11 rounded-xl bg-foreground text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Join vault
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {state.kind === 'joined' && (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 grid place-items-center">
              <CheckCircle2 className="size-7" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground text-balance">You're in {state.ownerName}'s family vault</h1>
            <p className="mt-2 text-sm text-muted-foreground text-balance">Next, review what you share — everything is on by default except gold.</p>
            <button type="button" onClick={goToVault} className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90">
              Open family vault <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {state.kind === 'declined' && (
          <div className="flex flex-col items-center py-2 text-center">
            <h1 className="text-xl font-semibold text-foreground">Invitation declined</h1>
            <p className="mt-2 text-sm text-muted-foreground">We've let the vault owner know. Nothing was shared.</p>
            <button type="button" onClick={() => navigate('/dashboard')} className="mt-6 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Go to dashboard
            </button>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="size-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 grid place-items-center">
              <AlertCircle className="size-7" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">We couldn't open this invitation</h1>
            <p className="mt-2 text-sm text-muted-foreground text-balance">{state.message}</p>
            <button type="button" onClick={goToVault} className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90">
              Go to Family Vault <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
