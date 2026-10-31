import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, LogOut, Trash2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFamilyStore, type Member, type Vault } from '../../store/familyStore';
import { SHARING_OPTIONS, inputClass, type SharingKeys } from './familyUi';

const pickPrefs = (m: Member): SharingKeys => ({
  shareBankAccounts: m.shareBankAccounts, shareFixedDeposits: m.shareFixedDeposits,
  shareMutualFunds: m.shareMutualFunds, shareEquity: m.shareEquity, shareNps: m.shareNps,
  shareEpf: m.shareEpf, shareInsurance: m.shareInsurance, shareLand: m.shareLand,
  shareGold: m.shareGold, shareTotalNetworth: m.shareTotalNetworth,
});

export default function SharingSettings({ vault, open, onOpenChange }: { vault: Vault; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { updateVisibility, leaveVault, closeVault } = useFamilyStore();
  const me = vault.members.find(m => m.isYou);
  const [prefs, setPrefs] = useState<SharingKeys | null>(me ? pickPrefs(me) : null);
  const [displayName, setDisplayName] = useState(me?.customName ?? '');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<null | 'leave' | 'close'>(null);
  const [working, setWorking] = useState(false);

  // Reset the form to the saved values each time it opens
  useEffect(() => {
    if (open && me) {
      setPrefs(pickPrefs(me));
      setDisplayName(me.customName ?? '');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me || !prefs) return null;
  const isOwner = vault.viewer.isOwner;
  const master = prefs.shareTotalNetworth;
  const nameError = displayName.trim() && !/^[\p{L} .'-]{2,50}$/u.test(displayName.trim())
    ? 'Use 2–50 letters' : '';

  const save = async () => {
    if (nameError) return;
    setSaving(true);
    try {
      await updateVisibility({ ...prefs, displayName: displayName.trim() });
      toast.success('Sharing settings saved');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runDanger = async () => {
    setWorking(true);
    try {
      if (confirm === 'leave') { await leaveVault(); toast.success('You left the family vault'); }
      else { await closeVault(); toast.success('Family vault closed'); }
      setConfirm(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[32rem] max-h-[90dvh] overflow-y-auto rounded-2xl border-border bg-card p-0 gap-0">
          <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-6 pr-14 text-left">
            <div className="size-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 grid place-items-center shrink-0">
              <SlidersHorizontal className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">What you share</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Only you control this. The family sees totals — never account numbers.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="family-display-name">Name shown to your family</Label>
              <input
                id="family-display-name"
                value={displayName}
                maxLength={50}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={me.displayName}
                className={inputClass}
                aria-invalid={!!nameError}
              />
              <p className={`text-xs ${nameError ? 'text-destructive' : 'text-muted-foreground'}`}>
                {nameError || 'Leave blank to use the name on your account.'}
              </p>
            </div>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 cursor-pointer">
              <span>
                <span className="block text-sm font-semibold text-foreground">Include my assets in the family view</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Turn off to stay in the vault without sharing any balances.</span>
              </span>
              <Switch
                checked={master}
                onCheckedChange={(v) => setPrefs({ ...prefs, shareTotalNetworth: v })}
                aria-label="Include my assets in the family view"
              />
            </label>

            <fieldset disabled={!master} className={`space-y-1 transition-opacity ${master ? '' : 'opacity-50'}`}>
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Asset types</legend>
              {SHARING_OPTIONS.map(opt => (
                <label key={opt.key} className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 hover:bg-muted/50 cursor-pointer">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                  <Switch
                    checked={prefs[opt.key]}
                    disabled={!master}
                    onCheckedChange={(v) => setPrefs({ ...prefs, [opt.key]: v })}
                    aria-label={`Share ${opt.label}`}
                  />
                </label>
              ))}
            </fieldset>

            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 p-3">
              <ShieldCheck className="size-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Family members see institution names and values for what you share. Account numbers, folio numbers and nominee names are never shown.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button className="h-10 rounded-xl" onClick={save} disabled={saving || !!nameError}>
                {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : 'Save changes'}
              </Button>
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {isOwner ? 'Manage vault' : 'Membership'}
              </p>
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirm(isOwner ? 'close' : 'leave')}
              >
                {isOwner ? <Trash2 className="size-4" /> : <LogOut className="size-4" />}
                {isOwner ? 'Close family vault' : 'Leave family vault'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => { if (!o && !working) setConfirm(null); }}>
        <AlertDialogContent className="max-w-[26rem] rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'close' ? 'Close this family vault?' : 'Leave this family vault?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'close'
                ? 'Everyone loses access, pending invites are cancelled, and shared goals and history are deleted. Your own accounts are not affected.'
                : 'Your family will no longer see any of your assets. You can rejoin only if the owner invites you again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void runDanger(); }}
              disabled={working}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {working ? <Loader2 className="size-4 animate-spin" /> : null}
              {confirm === 'close' ? 'Close vault' : 'Leave vault'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
