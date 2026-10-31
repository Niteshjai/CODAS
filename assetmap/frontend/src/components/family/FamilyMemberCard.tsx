import { useState } from 'react';
import { MoreHorizontal, Send, UserMinus, XCircle, ChevronRight, Crown, Clock, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFamilyStore, type Member, type MemberSummary } from '../../store/familyStore';
import { assetClassLabel, cardClass, daysUntil, initials, relationshipLabel, rupeesCompact } from './familyUi';

interface Props {
  member: Member;
  summary?: MemberSummary;
  viewerIsOwner: boolean;
  onOpen: (member: Member) => void;
}

export function MemberAvatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'size-7 text-[11px] rounded-lg' : size === 'lg' ? 'size-12 text-base rounded-2xl' : 'size-10 text-sm rounded-xl';
  return (
    <div className={`${dims} grid place-items-center font-semibold text-white shrink-0 shadow-sm`} style={{ backgroundColor: color }} aria-hidden="true">
      {initials(name)}
    </div>
  );
}

export default function FamilyMemberCard({ member, summary, viewerIsOwner, onOpen }: Props) {
  const { resendInvite, removeMember } = useFamilyStore();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  const isActive = member.status === 'active';
  const isPending = member.status === 'invited' || member.status === 'expired';
  const canManage = viewerIsOwner && member.role !== 'owner';
  const clickable = isActive;

  const handleResend = async () => {
    setBusy(true);
    try {
      const res = await resendInvite(member.id);
      toast.success(res.smsSent ? `Invitation re-sent to ${member.displayName}` : `Invitation renewed for 7 days. ${member.displayName} will see it when they sign in.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await removeMember(member.id);
      toast.success(isPending ? 'Invitation cancelled' : `${member.displayName} was removed`);
      setConfirmRemove(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const topClasses = summary
    ? Object.entries(summary.byAssetClass).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  return (
    <div
      className={`group relative flex flex-col ${cardClass} p-5 transition-all duration-200 ${clickable ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md' : ''} ${isPending ? 'border-dashed' : ''}`}
      onClick={clickable ? () => onOpen(member) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onOpen(member); } : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View ${member.displayName}'s shared assets` : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={isPending ? 'opacity-60' : ''}>
          <MemberAvatar name={member.displayName} color={member.avatarColor} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">{member.displayName}</h4>
            {member.isYou && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">You</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {member.role === 'owner' && <Crown className="size-3 text-amber-500" />}
            {relationshipLabel(member.relationship)}
          </p>
        </div>

        {member.status === 'invited' && (
          <span className="shrink-0 rounded-full border border-amber-200/70 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">Invited</span>
        )}
        {member.status === 'expired' && (
          <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Expired</span>
        )}

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="-mr-1.5 -mt-1 size-8 shrink-0 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Manage ${member.displayName}`}
                disabled={busy}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-48">
              {isPending && (
                <DropdownMenuItem onSelect={() => void handleResend()}>
                  <Send className="size-4" /> Resend invitation
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => setConfirmRemove(true)}
                className="text-destructive focus:text-destructive"
              >
                {isPending ? <><XCircle className="size-4" /> Cancel invitation</> : <><UserMinus className="size-4" /> Remove from vault</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex-1 flex flex-col justify-end">
        {isActive && summary && !summary.sharesNothing && (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Shared with family</p>
                <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{rupeesCompact(summary.totalPaise)}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            {topClasses.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topClasses.map(([cls]) => (
                  <span key={cls} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{assetClassLabel(cls)}</span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No linked accounts yet</p>
            )}
          </>
        )}

        {isActive && summary?.sharesNothing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <EyeOff className="size-3.5" />
            {member.isYou ? "You're not sharing any assets" : 'Not sharing assets'}
          </div>
        )}

        {isActive && !summary && (
          <div className="h-11 rounded-lg bg-muted/60 animate-pulse" aria-hidden="true" />
        )}

        {member.status === 'invited' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            <span>
              {member.mobileHint ? `Sent to +91 ${member.mobileHint} · ` : 'Waiting to accept · '}
              {member.expiresAt ? `expires in ${daysUntil(member.expiresAt)} day${daysUntil(member.expiresAt) === 1 ? '' : 's'}` : ''}
            </span>
          </p>
        )}

        {member.status === 'expired' && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Invitation expired before it was accepted</p>
            {canManage && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); void handleResend(); }}
                disabled={busy}
                className="shrink-0 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Resend
              </button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={(o) => { if (!busy) setConfirmRemove(o); }}>
        <AlertDialogContent className="max-w-[26rem] rounded-2xl bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isPending ? `Cancel ${member.displayName}'s invitation?` : `Remove ${member.displayName}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {isPending
                ? 'The invitation link will stop working. You can invite them again later.'
                : "They'll lose access to the family vault and their assets will no longer be included. Their own accounts are not affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleRemove(); }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {isPending ? 'Cancel invitation' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
