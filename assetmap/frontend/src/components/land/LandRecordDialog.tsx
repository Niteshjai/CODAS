import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, BadgeCheck, CheckCircle2, CircleDashed, Copy, ExternalLink, FileText,
  History, Landmark, Layers, LineChart as LineChartIcon, MapPin, RefreshCw, ShieldCheck, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { ErrorCard } from '../errors/ErrorCard';
import type { LandParcel } from './LandPropertyMap';
import {
  type LandUnit, formatArea, formatDate, formatINR, formatINRFull, humanise, sourceLabel, unitSingular, valuePerUnit,
} from './landFormat';
import { paiseToRupees, useLandRecordDetail, type LandRecordDetail } from './useLandRecordDetail';

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  warn: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  bad: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const TONE_ICON: Record<Tone, ReactNode> = {
  good: <CheckCircle2 className="size-4 shrink-0" />,
  warn: <AlertTriangle className="size-4 shrink-0" />,
  bad: <AlertTriangle className="size-4 shrink-0" />,
  neutral: <CircleDashed className="size-4 shrink-0" />,
};

function titleStatus(v: string | null): { tone: Tone; label: string; detail: string } {
  switch (v) {
    case 'clear': return { tone: 'good', label: 'Clear title', detail: 'No dispute is recorded against this parcel.' };
    case 'dispute': return { tone: 'bad', label: 'Dispute pending', detail: 'A dispute is recorded. Consult a lawyer before any sale or transfer.' };
    case 'mutation_pending': return { tone: 'warn', label: 'Mutation pending', detail: 'Ownership change is not yet reflected in revenue records.' };
    case 'encumbered': return { tone: 'warn', label: 'Encumbered', detail: 'A loan or charge is recorded against this parcel.' };
    default: return { tone: 'neutral', label: 'Not reported', detail: 'The registry did not report a title status.' };
  }
}

function mutationStatus(v: string | null): { tone: Tone; label: string; detail: string } {
  switch (v) {
    case 'completed': return { tone: 'good', label: 'Mutation recorded', detail: 'Ownership is updated in the land revenue records.' };
    case 'pending': return { tone: 'warn', label: 'Mutation pending', detail: 'Apply at the tehsil/taluka office to update the revenue records.' };
    case 'not_required': return { tone: 'neutral', label: 'Not required', detail: 'No ownership change needs to be recorded.' };
    default: return { tone: 'neutral', label: 'Not reported', detail: 'The registry did not report a mutation status.' };
  }
}

function encumbranceStatus(d: LandRecordDetail | null): { tone: Tone; label: string; detail: string } {
  const active = d?.encumbrances?.filter((e) => e.isActive !== false) ?? [];
  if (active.length) {
    return { tone: 'warn', label: `${active.length} active charge${active.length > 1 ? 's' : ''}`, detail: 'Loans or liabilities are recorded against this parcel.' };
  }
  const v = d?.encumbrance_status?.toLowerCase();
  if (v === 'none' || v === 'clear' || v === 'nil') return { tone: 'good', label: 'No encumbrance', detail: 'No loans or charges are recorded.' };
  if (v) return { tone: 'warn', label: humanise(v) ?? v, detail: 'Check the Encumbrance Certificate for details.' };
  return { tone: 'neutral', label: 'Not checked', detail: 'Get an Encumbrance Certificate (EC) from the sub-registrar to confirm there are no loans.' };
}

function Field({ label, value, mono = false, hint }: { label: string; value: ReactNode; mono?: boolean; hint?: ReactNode }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold ${empty ? 'font-normal text-muted-foreground' : 'text-foreground'} ${mono && !empty ? 'font-mono' : ''}`}>
        {empty ? 'Not recorded' : value}
      </dd>
      {hint && !empty && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Card({ title, icon, children, action, className = '' }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon} {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusTile({ heading, status }: { heading: string; status: { tone: Tone; label: string; detail: string } }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border p-3.5 ${TONE_CLASSES[status.tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{heading}</p>
      <p className="flex items-center gap-1.5 text-sm font-semibold">{TONE_ICON[status.tone]} {status.label}</p>
      <p className="text-xs leading-relaxed opacity-90">{status.detail}</p>
    </div>
  );
}

function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

function EmptyNote({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <div className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-[26rem] text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function BodySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading land record">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

interface Props {
  parcel: LandParcel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayUnit: LandUnit;
  onOpenValuation: () => void;
}

export default function LandRecordDialog({ parcel, open, onOpenChange, displayUnit, onOpenValuation }: Props) {
  const { detail: d, error, loading, retry } = useLandRecordDetail(parcel.id, open);
  const [tab, setTab] = useState('overview');

  const identifier = parcel.surveyNumber || parcel.khasraNumber || d?.plotNumber || null;
  const identifierLabel = parcel.surveyNumber ? 'Survey no.' : parcel.khasraNumber ? 'Khasra no.' : d?.plotNumber ? 'Plot no.' : 'Land parcel';
  const location = [parcel.village, parcel.taluka, parcel.district].filter((p) => p && p !== 'Unknown').join(', ');
  const region = [parcel.state, d?.pin_code].filter(Boolean).join(' – ');

  const value = paiseToRupees(d?.estimated_value_paise) ?? (parcel.estimatedValue > 0 ? parcel.estimatedValue : null);
  const circleRate = paiseToRupees(d?.circle_rate_paise);
  const perUnit = value ? valuePerUnit(value, parcel.areaAcres, displayUnit) : null;
  const vsCircle = value && circleRate ? ((value - circleRate) / circleRate) * 100 : null;
  const lat = Number(d?.latitude ?? parcel.latitude);
  const lng = Number(d?.longitude ?? parcel.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  const recordedArea = d?.area_value != null && d.area_unit && d.area_unit !== 'acres'
    ? `${Number(d.area_value).toLocaleString('en-IN')} ${d.area_unit} as recorded` : null;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(parcel.id);
      toast.success('Reference copied');
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const title = titleStatus(d?.title_status ?? null);
  const mutation = mutationStatus(d?.mutation_status ?? null);
  const encumbrance = encumbranceStatus(d);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[56rem] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 shadow-2xl sm:rounded-3xl"
      >
        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
          {/* Sticky header: identity + tabs stay visible while the body scrolls */}
          <header className="shrink-0 border-b border-border bg-card px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <div className="flex items-start gap-3 pr-10 sm:gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:size-12">
                <MapPin className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{identifierLabel}</p>
                <DialogTitle className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {identifier ?? 'Property record'}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {[location, region].filter(Boolean).join(' · ') || 'Location not recorded'}
                </DialogDescription>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {parcel.landType && parcel.landType !== 'Unknown' && <Chip><Layers className="size-3.5" /> {parcel.landType}</Chip>}
              <Chip>{formatArea(parcel.areaAcres, displayUnit)}</Chip>
              <Chip>{sourceLabel(d?.source ?? parcel.source)}</Chip>
              {d && (d.is_verified
                ? <Chip tone="good"><BadgeCheck className="size-3.5" /> Verified</Chip>
                : <Chip tone="neutral">Not yet verified</Chip>)}
            </div>

            <TabsList className="mt-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
              <TabsTrigger value="overview" className="shrink-0 rounded-lg px-3 py-1.5 text-xs sm:px-4 sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="ownership" className="shrink-0 rounded-lg px-3 py-1.5 text-xs sm:px-4 sm:text-sm"><span className="sm:hidden">Ownership</span><span className="hidden sm:inline">Ownership & title</span></TabsTrigger>
              <TabsTrigger value="documents" className="shrink-0 rounded-lg px-3 py-1.5 text-xs sm:px-4 sm:text-sm"><span className="sm:hidden">Documents</span><span className="hidden sm:inline">Source & documents</span></TabsTrigger>
            </TabsList>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {error && !d ? (
              <ErrorCard error={error} title="We couldn't load this land record" onRetry={retry} />
            ) : loading || !d ? (
              <BodySkeleton />
            ) : (
              <>
                {/* ── Overview ── */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card title="Property details" icon={<Layers className="size-4" />}>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <Field label="Land type" value={d.land_type && d.land_type !== 'Unknown' ? d.land_type : null} />
                        <Field label="Land use" value={humanise(d.land_use)} />
                        <Field label="Total area" value={formatArea(parcel.areaAcres, displayUnit)} hint={recordedArea} />
                        <Field label="Registered on" value={formatDate(d.registration_date)} />
                        <div className="col-span-2">
                          <Field
                            label="Location"
                            value={hasCoords ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null}
                            mono
                            hint={hasCoords ? (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                              >
                                Open in Google Maps <ExternalLink className="size-3" />
                              </a>
                            ) : null}
                          />
                        </div>
                      </dl>
                    </Card>

                    <Card
                      title="Valuation"
                      icon={<LineChartIcon className="size-4" />}
                      action={<span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estimate</span>}
                    >
                      {value ? (
                        <div className="flex flex-1 flex-col">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Estimated current value</p>
                          <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-4xl">{formatINR(value)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatINRFull(value)}</p>

                          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                            <Field label={`Per ${unitSingular(displayUnit)}`} value={perUnit ? formatINR(perUnit) : null} />
                            <Field label="Circle rate" value={circleRate ? formatINR(circleRate) : null} />
                          </dl>

                          {vsCircle !== null && (
                            <p className="mt-4 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-foreground">
                              Estimate is <span className="font-semibold">{Math.abs(vsCircle).toFixed(1)}% {vsCircle >= 0 ? 'above' : 'below'}</span> the government circle rate.
                            </p>
                          )}

                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                            <p className="text-xs text-muted-foreground">
                              {d.valuation_source ? `Basis: ${humanise(d.valuation_source)}` : `From ${sourceLabel(d.source)}`}
                              {formatDate(d.valuation_date) ? ` · ${formatDate(d.valuation_date)}` : ''}
                            </p>
                            <button
                              type="button"
                              onClick={onOpenValuation}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                            >
                              Valuation details
                            </button>
                          </div>
                        </div>
                      ) : (
                        <EmptyNote icon={<LineChartIcon className="size-4" />} title="No valuation yet">
                          The registry didn't provide a value for this parcel. It will appear here once a valuation is available.
                        </EmptyNote>
                      )}
                    </Card>
                  </div>

                  <Card title="Record status" icon={<ShieldCheck className="size-4" />}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <StatusTile heading="Title" status={title} />
                      <StatusTile heading="Mutation" status={mutation} />
                      <StatusTile heading="Encumbrance" status={encumbrance} />
                    </div>
                  </Card>
                </TabsContent>

                {/* ── Ownership & title ── */}
                <TabsContent value="ownership" className="mt-0 space-y-4">
                  <Card title="Ownership" icon={<Users className="size-4" />}>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                      <Field label="Recorded owner" value={d.ownerName} />
                      <Field label="Ownership type" value={humanise(d.ownership_type)} />
                      <Field label="Co-owners" value={d.co_owners_count ? String(d.co_owners_count) : (d.ownership_type === 'joint' ? null : 'None')} />
                      <Field label="Registered on" value={formatDate(d.registration_date)} />
                      <Field label="Registration no." value={d.registrationNumber} mono />
                      <Field label="Sub-registrar office" value={d.sub_registrar_office} />
                    </dl>
                    {d.disputeDetails && (
                      <div className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed ${TONE_CLASSES.bad}`}>
                        <p className="mb-1 font-semibold">Dispute details</p>
                        {d.disputeDetails}
                      </div>
                    )}
                  </Card>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card title="Mutation history" icon={<History className="size-4" />}>
                      <StatusTile heading="Current status" status={mutation} />
                      {d.mutations.length ? (
                        <ol className="mt-4 space-y-3">
                          {d.mutations.map((m) => (
                            <li key={m.id} className="rounded-xl border border-border p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{humanise(m.mutationType) ?? 'Mutation'}{m.mutationNumber ? ` #${m.mutationNumber}` : ''}</p>
                                <p className="shrink-0 text-xs text-muted-foreground">{formatDate(m.mutationDate) ?? 'Date not recorded'}</p>
                              </div>
                              {(m.fromOwner || m.toOwner) && (
                                <p className="mt-1 text-xs text-muted-foreground">{m.fromOwner ?? '—'} → {m.toOwner ?? '—'}</p>
                              )}
                              {m.remarks && <p className="mt-1 text-xs text-muted-foreground">{m.remarks}</p>}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-4 text-xs text-muted-foreground">No mutation entries were returned by the registry for this parcel.</p>
                      )}
                    </Card>

                    <Card title="Encumbrances" icon={<Landmark className="size-4" />}>
                      <StatusTile heading="Current status" status={encumbrance} />
                      {d.encumbrances.length ? (
                        <ul className="mt-4 space-y-3">
                          {d.encumbrances.map((e) => (
                            <li key={e.id} className="rounded-xl border border-border p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{humanise(e.encumbranceType) ?? 'Charge'}</p>
                                {e.amountPaise ? <p className="shrink-0 text-sm font-semibold text-foreground">{formatINR(e.amountPaise / 100)}</p> : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {e.creditorName ?? 'Creditor not recorded'}
                                {formatDate(e.startDate) ? ` · since ${formatDate(e.startDate)}` : ''}
                                {e.isActive === false ? ' · closed' : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-xs text-muted-foreground">No loans or charges were returned by the registry for this parcel.</p>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Source & documents ── */}
                <TabsContent value="documents" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card title="Data source" icon={<RefreshCw className="size-4" />}>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div className="col-span-2"><Field label="Fetched from" value={sourceLabel(d.source)} /></div>
                        <Field label="First fetched" value={formatDate(d.fetched_at)} />
                        <Field label="Last synced" value={formatDate(d.last_synced_at)} />
                        <Field label="Next refresh" value={formatDate(d.next_sync_at)} hint={d.sync_frequency_days ? `Every ${d.sync_frequency_days} days` : null} />
                        <Field label="Verification" value={d.is_verified ? `Verified${formatDate(d.verified_at) ? ` on ${formatDate(d.verified_at)}` : ''}` : 'Not yet verified'} />
                      </dl>
                      {d.is_stale && (
                        <p className={`mt-4 rounded-xl border px-3 py-2 text-xs ${TONE_CLASSES.warn}`}>
                          This record may be out of date. Refresh your land records to get the latest copy.
                        </p>
                      )}
                    </Card>

                    <Card title="DigiLocker document" icon={<FileText className="size-4" />}>
                      {d.digilocker_doc_available ? (
                        <div className="flex flex-1 flex-col gap-2">
                          <StatusTile
                            heading="Status"
                            status={{ tone: 'good', label: 'Digitised record available', detail: 'An official copy of this record can be fetched from DigiLocker.' }}
                          />
                          <Field label="Last fetched" value={formatDate(d.doc_last_fetched_at) ?? 'Not fetched yet'} />
                        </div>
                      ) : (
                        <EmptyNote icon={<FileText className="size-4" />} title="No digitised copy yet">
                          DigiLocker doesn't have a digitised record for this parcel yet. You can get a certified copy of the 7/12 extract / RoR from your state's land records portal or the tehsil office.
                        </EmptyNote>
                      )}
                    </Card>
                  </div>

                  <Card title="Identifiers" icon={<FileText className="size-4" />}>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                      <Field label="Survey no." value={d.surveyNumber} mono />
                      <Field label="Khasra no." value={d.khasraNumber} mono />
                      <Field label="Plot no." value={d.plotNumber} mono />
                      <Field label="ULPIN" value={d.ulpin} mono hint={d.ulpin ? 'Unique Land Parcel ID' : null} />
                      <Field label="PIN code" value={d.pin_code} mono />
                      <div className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">AssetMap reference</dt>
                        <dd className="mt-1 flex items-center gap-1.5">
                          <span className="truncate font-mono text-xs text-muted-foreground" title={parcel.id}>{parcel.id.slice(0, 8)}…</span>
                          <button
                            type="button"
                            onClick={copyRef}
                            aria-label="Copy AssetMap reference"
                            className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </dd>
                      </div>
                    </dl>
                    {d.notes && <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{d.notes}</p>}
                  </Card>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
