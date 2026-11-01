import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '../../services/api';
import { ErrorCard } from '../errors/ErrorCard';
import { formatDate, settingsErrorMessage, StatusPill } from './settingsUi';

interface Consent {
  consentId: string;
  fiTypes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
  revokedAt: string | null;
}

const FI_LABELS: Record<string, string> = {
  DEPOSIT: 'Bank accounts',
  EQUITY: 'Stocks',
  MUTUAL_FUND: 'Mutual funds',
  INSURANCE_POLICIES: 'Insurance',
  NPS: 'NPS',
  GSTN: 'GST records',
  LAND_RECORDS: 'Land records',
};

const STATUS: Record<Consent['status'], { label: string; tone: 'success' | 'muted' | 'warning' | 'danger' }> = {
  ACTIVE:  { label: 'Active',            tone: 'success' },
  PENDING: { label: 'Awaiting approval', tone: 'warning' },
  EXPIRED: { label: 'Expired',           tone: 'muted' },
  REVOKED: { label: 'Revoked',           tone: 'danger' },
};

/**
 * Real Account Aggregator consents: what each one shares, revoke, refresh now, add sources.
 * New or changed data sources always go through the AA approval flow on /consent —
 * consent can only become active after the user approves it with their AA.
 */
export default function ConsentPanel() {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Consent | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/consent');
      setConsents(res.data?.data ?? []);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const active = (consents ?? []).filter(c => c.status === 'ACTIVE');
  const visible = showAll ? (consents ?? []) : (consents ?? []).slice(0, 3);

  const refreshNow = async () => {
    setRefreshing(true);
    try {
      const res = await api.post('/assets/refresh');
      toast.success(res.data?.data?.message ?? 'Your financial data is up to date');
    } catch (err) {
      toast.error(settingsErrorMessage(err, "We couldn't refresh your data right now. Please try again later."));
    } finally {
      setRefreshing(false);
    }
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.delete(`/consent/${revokeTarget.consentId}`);
      toast.success('Consent revoked. We will no longer fetch data under it.');
      setRevokeTarget(null);
      await load();
    } catch (err) {
      toast.error(settingsErrorMessage(err, "We couldn't revoke this consent. Please try again."));
    } finally {
      setRevoking(false);
    }
  };

  if (error) {
    return <div className="px-5 sm:px-6 py-4"><ErrorCard compact error={error} title="Couldn't load your consents" onRetry={() => void load()} /></div>;
  }

  if (!consents) {
    return (
      <div className="px-5 sm:px-6 py-4 space-y-3" aria-busy="true" aria-label="Loading consents">
        {[0, 1].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-6 py-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Account Aggregator consents</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {active.length
              ? `${active.length} active — we can fetch data only for the sources listed under an active consent.`
              : 'No active consent — we are not fetching any financial data.'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={!active.length || refreshing} onClick={() => void refreshNow()}>
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh now
          </Button>
          <Button type="button" size="sm" className="rounded-full" onClick={() => navigate('/consent')}>
            <Plus /> Add sources
          </Button>
        </div>
      </div>

      {consents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-medium">You haven't granted any consent yet</p>
          <p className="text-xs text-muted-foreground mt-1">Link your accounts through an RBI-regulated Account Aggregator to see them here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map(c => {
            const s = STATUS[c.status] ?? STATUS.EXPIRED;
            return (
              <li key={c.consentId} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(c.fiTypes ?? []).map(t => (
                        <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">{FI_LABELS[t] ?? t}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Granted {formatDate(c.createdAt)} · data from {formatDate(c.dateRangeStart)} to {formatDate(c.dateRangeEnd)}
                      {c.revokedAt ? ` · revoked ${formatDate(c.revokedAt)}` : ''}
                    </p>
                  </div>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </div>
                {(c.status === 'ACTIVE' || c.status === 'PENDING') && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(c)}
                      className="text-xs font-semibold text-destructive hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Revoke consent
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {consents.length > 3 && (
        <button type="button" onClick={() => setShowAll(v => !v)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          {showAll ? 'Show fewer' : `Show all ${consents.length} consents`}
        </button>
      )}

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => { if (!o && !revoking) setRevokeTarget(null); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this consent?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll stop fetching {(revokeTarget?.fiTypes ?? []).map(t => FI_LABELS[t] ?? t).join(', ') || 'data'} under this consent.
              Data already shown stays until you delete it. You can grant a new consent any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={revoking}>Keep it</AlertDialogCancel>
            <Button variant="destructive" className="rounded-xl" disabled={revoking} onClick={() => void revoke()}>
              {revoking && <Loader2 className="animate-spin" />} Revoke
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
