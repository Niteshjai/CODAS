import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAssetStore } from '../store/assetStore';
import { getFinancialAssets } from '../services/assets';
import { DetailPageSkeleton, PageLoadError } from '../components/loading/DetailPageSkeleton';
import { ErrorCard } from '../components/errors/ErrorCard';
import { ArrowLeft, TrendingUp, TrendingDown, MoreHorizontal, ArrowRightLeft } from 'lucide-react';

// Mock holdings data since backend doesn't provide individual stocks yet
const MOCK_HOLDINGS = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', qty: 15, avgPrice: 2450.00, ltp: 2845.50, change: 1.58, type: 'EQUITY' },
  { id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', qty: 25, avgPrice: 3200.00, ltp: 3890.25, change: 0.45, type: 'EQUITY' },
  { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', qty: 120, avgPrice: 1650.00, ltp: 1435.10, change: -1.20, type: 'EQUITY' },
  { id: '4', symbol: 'INFY', name: 'Infosys Ltd.', qty: 50, avgPrice: 1420.00, ltp: 1678.90, change: 2.10, type: 'EQUITY' },
  { id: '5', symbol: 'ITC', name: 'ITC Ltd.', qty: 500, avgPrice: 280.00, ltp: 450.30, change: 0.15, type: 'EQUITY' },
  { id: '6', symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50 BeES', qty: 1500, avgPrice: 185.00, ltp: 245.80, change: 0.85, type: 'ETF' },
];

export default function BrokerPortfolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assets, setAssets } = useAssetStore();
  const [isLoading, setIsLoading] = useState(!assets.length);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!assets.length) {
      setIsLoading(true);
      setLoadError(null);
      getFinancialAssets()
        .then((data) => setAssets(data))
        .catch((err) => setLoadError(err))
        .finally(() => setIsLoading(false));
    }
  }, [assets.length, setAssets, reloadKey]);

  const asset = assets.find(a => a.id === id);

  if (isLoading) {
    return <DetailPageSkeleton label="Loading portfolio details" />;
  }

  if (loadError && !asset) {
    return (
      <PageLoadError>
        <ErrorCard error={loadError} title="We couldn't load this portfolio" onRetry={() => setReloadKey((k) => k + 1)} />
      </PageLoadError>
    );
  }

  if (!asset) {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate totals from mock data to make it realistic
  const totalInvested = MOCK_HOLDINGS.reduce((acc, h) => acc + (h.qty * h.avgPrice), 0);
  const currentValue = MOCK_HOLDINGS.reduce((acc, h) => acc + (h.qty * h.ltp), 0);
  const totalReturn = currentValue - totalInvested;
  const returnPct = (totalReturn / totalInvested) * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div className="page-gradient-bg min-h-screen flex flex-col font-sans text-foreground pb-20">
      <nav className="bg-white/30 dark:bg-card/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-white/20 dark:border-border/50 shadow-sm">
        <button onClick={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate('/dashboard');
          }
        }} className="flex items-center gap-2 text-foreground hover:text-foreground bg-card/50 hover:bg-card/80 border border-zinc-300/50 dark:border-zinc-700/50 shadow-sm px-3 py-1.5 rounded-full transition-all font-medium text-sm backdrop-blur-sm">
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>
        <div className="font-semibold tracking-wide">{asset.institutionName}</div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header / Summary Card */}
        <div className="bg-card rounded-[24px] p-6 md:p-8 shadow-sm border border-border/50 mb-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1 tracking-tight">Portfolio Value</h1>
            <p className="text-sm font-mono text-muted-foreground mb-4">{asset.accountRef || 'Demat Account'}</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl md:text-5xl font-bold tracking-tighter">₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex gap-8 md:gap-12 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Invested</p>
              <p className="font-semibold text-lg">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Overall Return</p>
              <div className={`flex items-center gap-1 font-bold text-lg ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isPositive ? '+' : '-'}₹{Math.abs(totalReturn).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                <span className="text-sm opacity-90 ml-1">({isPositive ? '+' : ''}{returnPct.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings List */}
        <div className="bg-card rounded-[24px] shadow-sm border border-border/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/25">
            <h2 className="text-lg font-bold text-foreground">Your Holdings ({MOCK_HOLDINGS.length})</h2>
            <button className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground bg-card border border-border rounded-full px-4 py-1.5 shadow-sm transition">
              <ArrowRightLeft className="size-3.5" />
              Recent Orders
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-card">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/3">Instrument</th>
                  <th className="px-6 py-4 font-semibold text-right">Qty & Avg</th>
                  <th className="px-6 py-4 font-semibold text-right">LTP</th>
                  <th className="px-6 py-4 font-semibold text-right">Current Value</th>
                  <th className="px-6 py-4 font-semibold text-right">P&L</th>
                  <th className="px-6 py-4 font-semibold text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {MOCK_HOLDINGS.map((h) => {
                  const invested = h.qty * h.avgPrice;
                  const current = h.qty * h.ltp;
                  const pnl = current - invested;
                  const pnlPct = (pnl / invested) * 100;
                  const hPositive = pnl >= 0;

                  return (
                    <tr key={h.id} className="hover:bg-muted/40 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground mb-0.5">{h.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{h.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-foreground mb-0.5">{h.qty}</div>
                        <div className="text-xs text-muted-foreground">₹{h.avgPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-foreground mb-0.5">₹{h.ltp.toFixed(2)}</div>
                        <div className={`text-xs font-medium flex items-center justify-end gap-0.5 ${h.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {h.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {Math.abs(h.change)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-foreground mb-0.5">₹{current.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold mb-0.5 ${hPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {hPositive ? '+' : '-'}₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-xs font-medium ${hPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {hPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-zinc-400 hover:text-foreground transition p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
