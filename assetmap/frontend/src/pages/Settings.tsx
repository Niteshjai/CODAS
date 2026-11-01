import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Download, History, Loader2, LogOut, Palette, Shield, ShieldCheck, Trash2, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '../services/api';
import { useAssetStore } from '../store/assetStore';
import { usePlanStore } from '../store/planStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ErrorCard } from '../components/errors/ErrorCard';
import EmailDialog from '../components/settings/EmailDialog';
import ConsentPanel from '../components/settings/ConsentPanel';
import {
  formatDate, InfoRow, LinkRow, SettingsSection, settingsErrorMessage, StatusPill, SubHeading, ToggleRow,
} from '../components/settings/settingsUi';

type NotificationKey = 'email' | 'sms' | 'push' | 'marketing' | 'balanceDrop' | 'newAccount' | 'landChange';

interface SettingsData {
  account: {
    name: string;
    mobile: string | null;
    email: string | null;
    memberSince: string | null;
    plan: { id: string; name: string };
  };
  notifications: Record<NotificationKey, boolean>;
  channels: {
    emailOnFile: boolean;
    smsAllowed: boolean;
    pushAllowed: boolean;
    requiredPlan: string | null;
    pushRegistered: boolean;
  };
}

const DELETE_PHRASE = 'DELETE MY DATA';

function clearLocalSession() {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch { /* storage may be unavailable */ }
  useAssetStore.getState().logout();
  usePlanStore.getState().invalidate();
}

export default function Settings() {
  const navigate = useNavigate();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState<Partial<Record<NotificationKey, boolean>>>({});
  const [twoFactor, setTwoFactor] = useState<boolean | 'error' | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await api.get('/settings');
      setData(res.data.data);
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  useEffect(() => {
    void load();
    api.get('/2fa/status')
      .then(res => setTwoFactor(!!res.data?.data?.isEnabled))
      .catch(() => setTwoFactor('error'));
  }, [load]);

  // Optimistic toggle: flip now, persist, revert with a message if the server says no
  const setNotification = async (key: NotificationKey, value: boolean) => {
    if (!data) return;
    const previous = data.notifications[key];
    setData(d => d && ({ ...d, notifications: { ...d.notifications, [key]: value } }));
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await api.patch('/settings/notifications', { [key]: value });
      setData(d => d && ({ ...d, notifications: res.data.data }));
    } catch (err) {
      setData(d => d && ({ ...d, notifications: { ...d.notifications, [key]: previous } }));
      toast.error(settingsErrorMessage(err, "We couldn't save that setting. Please try again."));
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const downloadData = async () => {
    setExporting(true);
    try {
      const res = await api.get('/settings/export', { responseType: 'blob' });
      const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assetmap-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Your data download has started');
    } catch (err) {
      toast.error(settingsErrorMessage(err, "We couldn't prepare your data. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await api.post('/settings/sessions/revoke-all');
      clearLocalSession();
      toast.success('Signed out of all devices');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(settingsErrorMessage(err, "We couldn't sign you out everywhere. Please try again."));
      setSigningOut(false);
    }
  };

  const deleteAccount = async () => {
    if (deletePhrase.trim() !== DELETE_PHRASE) return;
    setDeleting(true);
    try {
      await api.post('/auth/user/delete', { confirmPhrase: DELETE_PHRASE });
      clearLocalSession();
      toast.success('Your account and personal data have been deleted');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(settingsErrorMessage(err, "We couldn't delete your data. Please try again or contact support."));
      setDeleting(false);
    }
  };

  const n = data?.notifications;
  const ch = data?.channels;
  const planName = (id: string | null) => (id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Plus');

  return (
    <div className="page-gradient-bg min-h-screen text-foreground font-sans pb-20">
      <header className="sticky top-0 z-20 pt-4">
        <div className="w-full px-4 sm:px-6 md:px-10 py-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground bg-card/70 hover:bg-card border border-border shadow-sm px-3 py-1.5 rounded-full transition-colors font-medium text-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[48rem] px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-light tracking-tight">Account Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 text-balance">
            Manage your account, security, notifications and how your data is used.
          </p>
        </div>

        {loadError && !data ? (
          <ErrorCard error={loadError} title="We couldn't load your settings" onRetry={() => void load()} />
        ) : !data ? (
          <div className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Loading settings">
            {[4, 3, 6].map((rows, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-6 space-y-4">
                <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
                {Array.from({ length: rows }).map((_, j) => <div key={j} className="h-10 rounded-xl bg-muted/70 animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* ── Account */}
            <SettingsSection id="account" title="Account" description="Your identity details come from Aadhaar verification." icon={<UserRound className="size-5" />}>
              <InfoRow label="Name" value={data.account.name} description="As verified with Aadhaar — contact support to correct it." />
              <InfoRow label="Mobile number" value={data.account.mobile ?? '—'} description="Used to sign in." />
              <InfoRow
                label="Email"
                value={data.account.email ?? <span className="text-muted-foreground font-normal">Not added</span>}
                description="For email alerts and account notices."
                action={
                  <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEmailOpen(true)}>
                    {data.account.email ? 'Change' : 'Add email'}
                  </Button>
                }
              />
              <LinkRow
                label="Plan & billing"
                description={`Member since ${formatDate(data.account.memberSince)}`}
                value={<StatusPill tone={data.account.plan.id === 'free' ? 'muted' : 'success'}>{data.account.plan.name}</StatusPill>}
                onClick={() => navigate(data.account.plan.id === 'free' ? '/pricing' : '/billing')}
              />
            </SettingsSection>

            {/* ── Security */}
            <SettingsSection id="security" title="Security" description="Protect sign-in and see who accessed your data." icon={<ShieldCheck className="size-5" />}>
              <LinkRow
                label="Two-factor authentication"
                description="Add an authenticator app or email code at sign-in."
                value={
                  twoFactor === null ? <Loader2 className="size-4 animate-spin" aria-label="Loading 2FA status" />
                  : twoFactor === 'error' ? <StatusPill tone="muted">Unavailable</StatusPill>
                  : <StatusPill tone={twoFactor ? 'success' : 'warning'}>{twoFactor ? 'On' : 'Off'}</StatusPill>
                }
                onClick={() => navigate('/settings/2fa')}
              />
              <LinkRow
                label="Activity & access log"
                description="Every sign-in, consent and data access on your account."
                icon={<History className="size-4" />}
                onClick={() => navigate('/dashboard?tab=audit')}
              />
              <LinkRow
                label="Sign out of all devices"
                description="Ends every session, including this one."
                icon={<LogOut className="size-4" />}
                onClick={() => setSignOutOpen(true)}
              />
            </SettingsSection>

            {/* ── Notifications */}
            <SettingsSection id="notifications" title="Notifications" description="Choose how and when we alert you." icon={<Bell className="size-5" />}>
              <SubHeading>Channels</SubHeading>
              <ToggleRow id="n-inapp" label="In-app alerts" description="Always on — shown under the bell in your dashboard." checked disabled onChange={() => {}} />
              <ToggleRow
                id="n-email" label="Email alerts"
                description={ch!.emailOnFile
                  ? 'Important changes like balance drops and new accounts, sent to your email.'
                  : <>Add an email address first. <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => setEmailOpen(true)}>Add email</button></>}
                checked={n!.email && ch!.emailOnFile} disabled={!ch!.emailOnFile} saving={saving.email}
                onChange={(v) => void setNotification('email', v)}
              />
              <ToggleRow
                id="n-sms" label="SMS alerts" description="Urgent security alerts by text message to your mobile."
                checked={n!.sms} saving={saving.sms}
                locked={!ch!.smsAllowed} lockLabel={planName(ch!.requiredPlan)} onLockedClick={() => navigate('/pricing')}
                onChange={(v) => void setNotification('sms', v)}
              />
              <ToggleRow
                id="n-push" label="Push notifications"
                description={ch!.pushRegistered
                  ? 'Alerts on devices where you allowed AssetMap notifications.'
                  : 'Delivered to the AssetMap mobile app once you allow notifications there.'}
                checked={n!.push} saving={saving.push}
                locked={!ch!.pushAllowed} lockLabel={planName(ch!.requiredPlan)} onLockedClick={() => navigate('/pricing')}
                onChange={(v) => void setNotification('push', v)}
              />

              <SubHeading>What to alert me about</SubHeading>
              <ToggleRow id="n-drop" label="Large balance drops" description="When your total balance falls sharply since the previous day."
                checked={n!.balanceDrop} saving={saving.balanceDrop} onChange={(v) => void setNotification('balanceDrop', v)} />
              <ToggleRow id="n-newacc" label="New accounts linked to your Aadhaar" description="Helps you catch accounts you didn't open."
                checked={n!.newAccount} saving={saving.newAccount} onChange={(v) => void setNotification('newAccount', v)} />
              <ToggleRow id="n-land" label="Property record changes" description="When a land record in your name is updated in the registry."
                checked={n!.landChange} saving={saving.landChange} onChange={(v) => void setNotification('landChange', v)} />

              <SubHeading>From AssetMap</SubHeading>
              <ToggleRow id="n-marketing" label="Product news & offers" description="Occasional updates about new features. Off unless you opt in; we never share your data with advertisers."
                checked={n!.marketing} saving={saving.marketing} onChange={(v) => void setNotification('marketing', v)} />
            </SettingsSection>

            {/* ── Data & privacy */}
            <SettingsSection id="privacy" title="Data & privacy" description="Control what we fetch and what we keep." icon={<Shield className="size-5" />}>
              <ConsentPanel />
              <LinkRow
                label="Download my data"
                description="A JSON copy of your profile, consents, assets, alerts and activity log."
                icon={exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                onClick={() => { if (!exporting) void downloadData(); }}
              />
              <LinkRow
                tone="danger"
                label="Delete account & data"
                description="Permanently erase your personal and financial data. Audit logs are kept as the law requires."
                icon={<Trash2 className="size-4" />}
                onClick={() => { setDeletePhrase(''); setDeleteOpen(true); }}
              />
            </SettingsSection>

            {/* ── Appearance */}
            <SettingsSection id="appearance" title="Appearance" icon={<Palette className="size-5" />}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">System follows your device setting.</p>
                </div>
                <ThemeToggle style="three-way" className="self-start sm:self-auto" />
              </div>
            </SettingsSection>
          </div>
        )}
      </main>

      {data && (
        <EmailDialog open={emailOpen} onOpenChange={setEmailOpen} hasEmail={!!data.account.email} onSaved={() => void load()} />
      )}

      <AlertDialog open={signOutOpen} onOpenChange={(o) => { if (!signingOut) setSignOutOpen(o); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              Every active session ends, including this one. You'll need your mobile OTP to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={signingOut}>Cancel</AlertDialogCancel>
            <Button className="rounded-xl" disabled={signingOut} onClick={() => void signOutEverywhere()}>
              {signingOut && <Loader2 className="animate-spin" />} Sign out everywhere
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!deleting) setDeleteOpen(o); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[30rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account and data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently erases your profile, linked accounts, property records, wills, family vault memberships and
              alerts. It can't be undone. Consider downloading your data first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            noValidate
            onSubmit={(e) => { e.preventDefault(); void deleteAccount(); }}
            className="space-y-2"
          >
            <Label htmlFor="delete-phrase">Type <span className="font-mono font-semibold">{DELETE_PHRASE}</span> to confirm</Label>
            <Input
              id="delete-phrase" autoComplete="off" value={deletePhrase} disabled={deleting}
              onChange={(e) => setDeletePhrase(e.target.value)} className="h-11 rounded-xl font-mono"
            />
            <AlertDialogFooter className="pt-3">
              <AlertDialogCancel type="button" className="rounded-xl" disabled={deleting}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" className="rounded-xl" disabled={deleting || deletePhrase.trim() !== DELETE_PHRASE}>
                {deleting && <Loader2 className="animate-spin" />} Delete permanently
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
