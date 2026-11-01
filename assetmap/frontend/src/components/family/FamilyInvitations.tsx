import { useState } from 'react';
import { Mail, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFamilyStore, type Invitation } from '../../store/familyStore';
import { daysUntil, relationshipLabel } from './familyUi';

/** Pending invitations addressed to the signed-in user's mobile number. */
export default function FamilyInvitations() {
  const { invitations, previewInvite, acceptInvite, declineInvite } = useFamilyStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState<Invitation | null>(null);

  if (invitations.length === 0) return null;

  const accept = async (inv: Invitation, skipCheck = false) => {
    setBusy(inv.inviteId);
    try {
      if (!skipCheck) {
        const preview = await previewInvite({ inviteId: inv.inviteId });
        if (preview.blockedReason) { toast.error(preview.blockedReason); return; }
        if (preview.replacesOwnVault) { setConfirmReplace(inv); return; }
      }
      const res = await acceptInvite({ inviteId: inv.inviteId });
      toast.success(`You joined ${res.primaryUserName}'s family vault`);
      setConfirmReplace(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const decline = async (inv: Invitation) => {
    setBusy(inv.inviteId);
    try {
      await declineInvite(inv.inviteId);
      toast.success('Invitation declined');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label="Family vault invitations" className="space-y-3">
      {invitations.map(inv => (
        <div key={inv.inviteId} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-lime-300/60 dark:border-lime-800/50 bg-lime-50/80 dark:bg-lime-950/20 p-4 sm:p-5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="size-10 rounded-xl bg-lime-200/70 dark:bg-lime-900/40 text-lime-800 dark:text-lime-300 grid place-items-center shrink-0">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {inv.inviterName} invited you to “{inv.vaultName}”
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                As their {relationshipLabel(inv.relationship).toLowerCase()} · expires in {daysUntil(inv.expiresAt)} day{daysUntil(inv.expiresAt) === 1 ? '' : 's'} · you choose what to share after joining
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 sm:ml-auto">
            <button
              type="button"
              onClick={() => void decline(inv)}
              disabled={busy !== null}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              <X className="size-3.5" /> Decline
            </button>
            <button
              type="button"
              onClick={() => void accept(inv)}
              disabled={busy !== null}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy === inv.inviteId ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Accept
            </button>
          </div>
        </div>
      ))}

      <AlertDialog open={!!confirmReplace} onOpenChange={(o) => { if (!o && !busy) setConfirmReplace(null); }}>
        <AlertDialogContent className="max-w-[26rem] rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Join {confirmReplace?.inviterName}'s family vault?</AlertDialogTitle>
            <AlertDialogDescription>
              You can be in one family vault at a time. Your own vault has no other members, so it will be closed and any goals in it removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busy}>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (confirmReplace) void accept(confirmReplace, true); }} disabled={!!busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Join vault
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
