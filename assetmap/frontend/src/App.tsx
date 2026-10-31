import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Fragment, useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useAssetStore } from './store/assetStore';
import { useNetworkStore } from './store/networkStore';
import { AppError } from './errors/AppError';
import { getSession } from './services/auth';
import { ErrorBoundary } from './errors/ErrorBoundary';
import { ToastContainer } from './components/feedback/Toast';
import { OfflineBanner } from './components/feedback/OfflineBanner';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import Login from './pages/login/Login';
import ConsentFlow from './pages/ConsentFlow';
import Dashboard from './pages/Dashboard';
import AssetDetail from './pages/AssetDetail';
import BrokerPortfolio from './pages/BrokerPortfolio';
import EstateFiling from './pages/EstateFiling';
import Report from './pages/Report';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import UnclaimedAssets from './pages/UnclaimedAssets';
import { PricingPage } from './components/plans/PricingPage';
import { BillingDashboard } from './components/plans/BillingDashboard';
import NomineeUpdatePage from './components/nominee/NomineeUpdatePage';
import FamilyJoinPage from './components/family/FamilyJoinPage';
import InsuranceGapFinder from './components/insurance/InsuranceGapFinder';
import LoanEligibility from './components/loan/LoanEligibility';
import AncestralSearchPage from './components/ancestral/AncestralSearchPage';
import TwoFactorSettings from './pages/Settings/TwoFactorSettings';
import TOTPSetup from './pages/Settings/TOTPSetup';
import EmailSetup from './pages/Settings/EmailSetup';
import './index.css';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function NetworkManager() {
  useNetworkStatus();
  return <OfflineBanner />;
}

/**
 * Remounts the current page after the connection comes back, but only if a data load
 * failed during the outage — so pages refetch without wiping forms that loaded fine.
 */
function ReloadOnReconnect({ children }: { children: React.ReactNode }) {
  const reconnectCount = useNetworkStore((s) => s.reconnectCount);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    if (reconnectCount > 0 && useNetworkStore.getState().consumeStaleData()) {
      setEpoch((e) => e + 1);
    }
  }, [reconnectCount]);

  return <Fragment key={epoch}>{children}</Fragment>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAssetStore((s) => s.isAuthenticated);
  const authChecked = useAssetStore((s) => s.authChecked);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[#006c49]/30 border-t-[#006c49] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  // We no longer blindly redirect based on hasConsent to avoid the refresh bug.
  // The Dashboard will fetch the actual consents and redirect if needed.

  return <>{children}</>;
}

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const authChecked = useAssetStore((s) => s.authChecked);
  const setUser = useAssetStore((s) => s.setUser);
  const setAuthChecked = useAssetStore((s) => s.setAuthChecked);
  const reconnectCount = useNetworkStore((s) => s.reconnectCount);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authChecked) return;
    let cancelled = false;

    getSession()
      .then(({ user }) => {
        if (cancelled) return;
        setConnectionFailed(false);
        setUser(user);
        setAuthChecked(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // Can't reach the server ≠ logged out: keep the session and wait for the connection
        if (err instanceof AppError && err.category === 'network') {
          setConnectionFailed(true);
          return;
        }
        setUser(null);
        setAuthChecked(true);
      });

    return () => { cancelled = true; };
    // reconnectCount/attempt re-run the check when the connection returns or the user retries
  }, [authChecked, setUser, setAuthChecked, reconnectCount, attempt]);

  if (!authChecked && connectionFailed) {
    return <ConnectionErrorScreen onRetry={() => setAttempt((a) => a + 1)} />;
  }

  return <>{children}</>;
}

function ConnectionErrorScreen({ onRetry }: { onRetry: () => void }) {
  const isOnline = useNetworkStore((s) => s.isOnline);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div role="alert" className="max-w-sm text-center">
        <WifiOff className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">
          {isOnline ? 'Can’t connect to AssetMap' : 'You’re offline'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOnline
            ? 'Your connection seems unstable. We’ll keep trying, or you can retry now.'
            : 'Check your Wi-Fi or mobile data. We’ll reconnect automatically.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <NetworkManager />
        <ToastContainer />
        <SessionBootstrap>
          <div className="min-h-screen">
            <ReloadOnReconnect>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/consent" element={<ProtectedRoute><ConsentFlow /></ProtectedRoute>} />
              <Route path="/consent/callback" element={<ProtectedRoute><ConsentFlow /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/asset/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
              <Route path="/broker/:id" element={<ProtectedRoute><BrokerPortfolio /></ProtectedRoute>} />
              <Route path="/estate" element={<ProtectedRoute><EstateFiling /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/2fa" element={<ProtectedRoute><TwoFactorSettings /></ProtectedRoute>} />
              <Route path="/settings/2fa/totp" element={<ProtectedRoute><TOTPSetup /></ProtectedRoute>} />
              <Route path="/settings/2fa/email" element={<ProtectedRoute><EmailSetup /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/unclaimed" element={<ProtectedRoute><UnclaimedAssets /></ProtectedRoute>} />
              <Route path="/nominee" element={<ProtectedRoute><NomineeUpdatePage /></ProtectedRoute>} />
              <Route path="/nominee/update" element={<ProtectedRoute><NomineeUpdatePage /></ProtectedRoute>} />
              <Route path="/family/join" element={<ProtectedRoute><FamilyJoinPage /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><BillingDashboard /></ProtectedRoute>} />
              <Route path="/insurance/gap" element={<ProtectedRoute><InsuranceGapFinder /></ProtectedRoute>} />
              <Route path="/loan/eligibility" element={<ProtectedRoute><LoanEligibility /></ProtectedRoute>} />
              <Route path="/ancestral" element={<ProtectedRoute><AncestralSearchPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ReloadOnReconnect>
          </div>
        </SessionBootstrap>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

