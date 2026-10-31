import type { ReactNode } from 'react';
import { CalendarClock, Info, Landmark, LineChart as LineChartIcon, MapPin, Ruler, TrendingDown, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { ErrorCard } from '../errors/ErrorCard';
import type { LandParcel } from './LandPropertyMap';
import { type LandUnit, formatArea, formatDate, formatINR, formatINRFull, humanise, sourceLabel, unitSingular, valuePerUnit } from './landFormat';
import { paiseToRupees, useLandRecordDetail } from './useLandRecordDetail';

function Tile({ icon, label, value, sub, muted = false }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; muted?: boolean }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{icon} {label}</p>
      <p className={`mt-2 text-xl font-bold tracking-tight ${muted ? 'text-base font-medium text-muted-foreground' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface Props {
  parcel: LandParcel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayUnit: LandUnit;
}

export default function LandValuationDialog({ parcel, open, onOpenChange, displayUnit }: Props) {
  const { detail: d, error, loading, retry } = useLandRecordDetail(parcel.id, open);

  const identifier = parcel.surveyNumber || parcel.khasraNumber || 'Land parcel';
  const location = [parcel.village, parcel.district].filter((p) => p && p !== 'Unknown').join(', ');
  const value = paiseToRupees(d?.estimated_value_paise) ?? (parcel.estimatedValue > 0 ? parcel.estimatedValue : null);
  const circleRate = paiseToRupees(d?.circle_rate_paise);
  const perUnit = value ? valuePerUnit(value, parcel.areaAcres, displayUnit) : null;
  // Per sq.ft is the figure buyers compare; skip it when that's already the display unit
  const perSqft = value && displayUnit !== 'sqft' ? valuePerUnit(value, parcel.areaAcres, 'sqft') : null;
  const diff = value && circleRate ? value - circleRate : null;
  const diffPct = diff !== null && circleRate ? (diff / circleRate) * 100 : null;
  const asOf = formatDate(d?.valuation_date) ?? formatDate(d?.last_synced_at);
  const basis = d?.valuation_source ? humanise(d.valuation_source) : sourceLabel(d?.source ?? parcel.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[42rem] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 shadow-2xl sm:rounded-3xl">
        {/* Sticky header */}
        <header className="shrink-0 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 pr-10 sm:gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:size-12">
              <LineChartIcon className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valuation estimate</p>
              <DialogTitle className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{identifier}</DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {location}</span>}
                <span className="inline-flex items-center gap-1"><Ruler className="size-3.5" /> {formatArea(parcel.areaAcres, displayUnit)}</span>
              </DialogDescription>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error && !d ? (
            <ErrorCard error={error} title="We couldn't load the valuation" onRetry={retry} />
          ) : loading || !d ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading valuation">
              <Skeleton className="h-40 rounded-2xl" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </div>
          ) : !value ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><LineChartIcon className="size-5" /></div>
              <p className="text-sm font-semibold text-foreground">No valuation available</p>
              <p className="max-w-[24rem] text-xs leading-relaxed text-muted-foreground">
                The land registry didn't provide a value for this parcel. We'll show one here as soon as it's available.
              </p>
            </div>
          ) : (
            <>
              {/* Headline value */}
              <section className="rounded-2xl border border-border bg-card p-5 text-center sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estimated market value</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-5xl">{formatINR(value)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatINRFull(value)}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Basis: <span className="font-medium text-foreground">{basis}</span></span>
                  {asOf && <span>As of <span className="font-medium text-foreground">{asOf}</span></span>}
                </div>
              </section>

              {/* Rates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Tile
                  icon={<Ruler className="size-3.5" />}
                  label={`Rate per ${unitSingular(displayUnit)}`}
                  value={perUnit ? formatINR(perUnit) : 'Area not recorded'}
                  muted={!perUnit}
                  sub={perUnit ? <>Estimated value ÷ recorded area{perSqft ? <> · {formatINR(perSqft)} per sq.ft</> : null}</> : null}
                />
                <Tile
                  icon={<Landmark className="size-3.5" />}
                  label="Govt. circle rate"
                  value={circleRate ? formatINR(circleRate) : 'Not available'}
                  muted={!circleRate}
                  sub={circleRate
                    ? `Minimum value set by the ${parcel.state} government for stamp duty.`
                    : `The registry didn't report the circle rate. Check your state's IGR portal for ${parcel.district !== 'Unknown' ? parcel.district : 'this district'}.`}
                />
              </div>

              {diff !== null && diffPct !== null && (
                <section className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                    {diff >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatINR(Math.abs(diff))} ({Math.abs(diffPct).toFixed(1)}%) {diff >= 0 ? 'above' : 'below'} circle rate
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {diff >= 0
                        ? 'Stamp duty is charged on the higher of the sale price and the circle-rate value.'
                        : 'A sale below circle rate still attracts stamp duty on the circle-rate value.'}
                    </p>
                  </div>
                </section>
              )}

              {/* History: only real snapshots would go here — none are stored for land parcels yet */}
              <section className="rounded-2xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <CalendarClock className="size-3.5" /> Valuation history
                </p>
                <p className="mt-2 text-sm text-foreground">No past valuations recorded yet.</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  The value is refreshed with your land records{d.sync_frequency_days ? ` every ${d.sync_frequency_days} days` : ''}
                  {formatDate(d.next_sync_at) ? ` (next on ${formatDate(d.next_sync_at)})` : ''}. A trend will appear once there's history to compare.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Sticky footer */}
        <footer className="flex shrink-0 flex-col gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            An indicative estimate, not a certified valuation. Use a registered valuer for loans or sale.
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 active:scale-95"
          >
            Done
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
