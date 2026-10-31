import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../loading/CardSkeleton';
import { ListSkeleton } from '../loading/ListSkeleton';
import { Skeleton } from '../loading/Skeleton';
import { ErrorCard } from '../errors/ErrorCard';

export const BillingDashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [statusRes, historyRes] = await Promise.all([
          api.get('/plans/status'),
          api.get('/plans/billing-history')
        ]);
        setStatus(statusRes.data.data);
        setHistory(historyRes.data.data);
      } catch (err) {
        setLoadError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [reloadKey]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      await api.post('/plans/cancel');
      alert('Subscription will be cancelled at the end of the billing period.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel subscription');
    }
  };

  if (loading || loadError) {
    return (
      <div className="page-gradient-bg min-h-screen text-foreground font-sans">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          <Skeleton width={280} height={32} />
          {loadError ? (
            <ErrorCard error={loadError} title="We couldn't load your billing details" onRetry={() => setReloadKey((k) => k + 1)} />
          ) : (
            <>
              <CardSkeleton rows={3} className="rounded-2xl" />
              <ListSkeleton rows={3} />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-gradient-bg min-h-screen text-foreground font-sans" style={{ contain: 'layout style' }}>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      
      <div className="bg-card rounded-2xl shadow p-6 mb-8 border border-border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Current Plan</h2>
            <p className="text-muted-foreground text-sm">
              You are currently on the <strong className="text-foreground capitalize">{status?.planName}</strong> plan.
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            status?.status === 'active' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300'
          }`}>
            {status?.status}
          </span>
        </div>

        {status?.planId !== 'free' && status?.status === 'active' && (
          <div className="border-t pt-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                <p className="font-medium capitalize">{status?.billingCycle}</p>
              </div>
              {status?.currentPeriodEnd && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
                  <p className="font-medium">{new Date(status.currentPeriodEnd).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex gap-4">
              <Link to="/pricing" className="px-4 py-2 bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                Change Plan
              </Link>
              {!status?.cancelAtPeriodEnd && (
                <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-muted/50">
                  Cancel Subscription
                </button>
              )}
              {status?.cancelAtPeriodEnd && (
                <span className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400">
                  Cancels on {new Date(status.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {status?.planId === 'free' && (
          <div className="mt-6">
            <Link to="/pricing" className="inline-block px-6 py-3 bg-lime-500 text-foreground font-bold rounded-xl hover:bg-lime-600 transition-colors">
              Upgrade to Premium
            </Link>
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Payment History</h2>
      <div className="bg-card rounded-xl shadow border border-border overflow-hidden">
        {history.length > 0 ? (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {history.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {new Date(payment.paid_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ₹{payment.total_paise / 100}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'paid' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-muted-foreground text-sm">No payment history found.</div>
        )}
      </div>
      </div>
    </div>
  );
};
