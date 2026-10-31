import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, UserPlus, Scale, Check, Plus, Loader2, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import WillBeneficiaryForm, { RELATIONSHIPS, selectClass } from './WillBeneficiaryForm';
import WillPreview from './WillPreview';
import { api } from '@/services/api';
import { useAssetStore } from '@/store/assetStore';
import { ErrorCard } from '@/components/errors/ErrorCard';
import { CardSkeleton } from '@/components/loading/CardSkeleton';
import { toast } from 'sonner';

type Step = 'details' | 'beneficiaries' | 'assets' | 'review';

interface Details {
  testatorName: string;
  testatorDob: string;
  testatorAddress: string;
  testatorPan: string;
  executorName: string;
  executorRelation: string;
  executorMobile: string;
}
interface Beneficiary { id: string; name: string; relation: string }
interface Allocation {
  id: string;
  assetType: string;
  assetRefId: string | null;
  assetDescription: string;
  beneficiaryId: string | null;
  beneficiaryName: string;
  allocationPct: number;
}
interface AssetOption { key: string; refId: string | null; type: string; name: string; valuePaise: number }

const EMPTY_DETAILS: Details = {
  testatorName: '', testatorDob: '', testatorAddress: '', testatorPan: '',
  executorName: '', executorRelation: '', executorMobile: '',
};

const OTHER_ASSET = '__other__';
const OTHER_ASSET_TYPES = [
  { value: 'jewelry', label: 'Gold / jewellery' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other asset' },
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Synced FI types → will_allocations.asset_type values accepted by the backend
function assetTypeFor(fiType: string): string {
  const t = fiType.toUpperCase();
  if (t.includes('DEPOSIT') || t.includes('BANK')) return 'bank_account';
  if (t.includes('MUTUAL')) return 'mutual_fund';
  if (t.includes('EQUIT')) return 'equity';
  if (t.includes('INSURANCE')) return 'insurance_policy';
  if (t.includes('NPS')) return 'nps';
  return 'other';
}

// Accept pasted "+91 98765 43210" / "098765 43210": strip formatting before limiting to 10 digits
function normaliseMobile(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function maxAdultDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

function validateDetails(d: Details): Partial<Record<keyof Details, string>> {
  const errors: Partial<Record<keyof Details, string>> = {};
  if (d.testatorName.trim().length < 2) errors.testatorName = 'Enter your full legal name.';
  if (!d.testatorDob) errors.testatorDob = 'Enter your date of birth.';
  else if (d.testatorDob > maxAdultDob()) errors.testatorDob = 'You must be at least 18 to make a will.';
  else if (d.testatorDob < '1900-01-01') errors.testatorDob = 'Enter a valid date of birth.';
  if (d.testatorAddress.trim().length < 5) errors.testatorAddress = 'Enter your full residential address.';
  if (d.testatorPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(d.testatorPan)) errors.testatorPan = 'PAN must look like ABCDE1234F.';
  if (d.executorName.trim().length < 2) errors.executorName = "Enter your executor's full name.";
  else if (d.executorName.trim().toLowerCase() === d.testatorName.trim().toLowerCase()) errors.executorName = 'Your executor must be someone other than you.';
  if (!d.executorRelation) errors.executorRelation = 'Select their relationship to you.';
  if (!/^[6-9]\d{9}$/.test(d.executorMobile)) errors.executorMobile = 'Enter a valid 10-digit Indian mobile number.';
  return errors;
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function WillBuilder() {
  const { assets, landRecords, user } = useAssetStore();

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<unknown>(null);
  const [step, setStep] = useState<Step>('details');
  const [willId, setWillId] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [savedDetails, setSavedDetails] = useState<Details | null>(null);
  const [touched, setTouched] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Allocation form
  const [assetKey, setAssetKey] = useState('');
  const [otherDescription, setOtherDescription] = useState('');
  const [otherType, setOtherType] = useState('jewelry');
  const [allocBeneficiaryId, setAllocBeneficiaryId] = useState('');
  const [allocPct, setAllocPct] = useState('');
  const [allocError, setAllocError] = useState('');

  // ── Load (resume) the active will
  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await api.get('/will/current');
      const current = res.data?.data;
      if (current) {
        const d: Details = { ...EMPTY_DETAILS, ...current.details };
        setWillId(current.willId);
        setDetails(d);
        setSavedDetails(d);
        setBeneficiaries(current.beneficiaries ?? []);
        setAllocations(current.allocations ?? []);
        setGeneratedAt(current.status === 'completed' ? current.pdfGeneratedAt : null);
        setStep(current.allocations?.length ? 'review' : current.beneficiaries?.length ? 'assets' : 'beneficiaries');
      }
      setLoadState('ready');
    } catch (err) {
      setLoadError(err);
      setLoadState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Prefill the testator name from the verified account for a new will
  useEffect(() => {
    if (loadState === 'ready' && !willId && !details.testatorName && user?.name) {
      setDetails(d => ({ ...d, testatorName: user.name }));
    }
  }, [loadState, willId, user?.name, details.testatorName]);

  const detailErrors = useMemo(() => validateDetails(details), [details]);
  const detailsValid = Object.keys(detailErrors).length === 0;
  const detailsDirty = !savedDetails || JSON.stringify(savedDetails) !== JSON.stringify(details);
  const showError = (k: keyof Details) => (touched ? detailErrors[k] : undefined);

  const assetOptions: AssetOption[] = useMemo(() => [
    ...assets.map(a => ({
      key: a.id,
      refId: UUID_RE.test(a.id) ? a.id : null,
      type: assetTypeFor(a.fiType),
      name: `${a.institutionName} ${a.accountRef ? `· ${a.accountRef}` : ''}`.trim(),
      valuePaise: Math.round((a.balance || 0) * 100),
    })),
    ...landRecords.map(l => ({
      key: l.id,
      refId: UUID_RE.test(l.id) ? l.id : null,
      type: 'land_record',
      name: `Land ${l.surveyNumber ? `(Survey ${l.surveyNumber}) ` : ''}at ${[l.village, l.district, l.state].filter(Boolean).join(', ')}`,
      valuePaise: l.estimated_value_paise || 0,
    })),
  ], [assets, landRecords]);

  const allocatedFor = useCallback((refId: string | null, description: string) =>
    allocations
      .filter(a => (refId ? a.assetRefId === refId : !a.assetRefId && a.assetDescription.toLowerCase() === description.toLowerCase()))
      .reduce((sum, a) => sum + a.allocationPct, 0), [allocations]);

  const selectedAsset = assetKey === OTHER_ASSET
    ? { key: OTHER_ASSET, refId: null, type: otherType, name: otherDescription.trim(), valuePaise: 0 }
    : assetOptions.find(a => a.key === assetKey);
  const remaining = selectedAsset?.name ? Math.max(0, 100 - allocatedFor(selectedAsset.refId, selectedAsset.name)) : 100;

  // Default the share to whatever is left of the chosen asset
  useEffect(() => { if (assetKey) setAllocPct(String(remaining)); }, [assetKey, remaining]);

  const unallocatedBeneficiaries = beneficiaries.filter(b => !allocations.some(a => a.beneficiaryId === b.id || a.beneficiaryName === b.name));

  const stepEnabled: Record<Step, boolean> = {
    details: true,
    beneficiaries: !!willId,
    assets: !!willId && beneficiaries.length > 0,
    review: !!willId && allocations.length > 0,
  };

  // ── Actions
  const saveDetails = async () => {
    setTouched(true);
    if (!detailsValid) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (willId && !detailsDirty) {
      setStep('beneficiaries');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...details,
        testatorName: details.testatorName.trim(),
        testatorAddress: details.testatorAddress.trim(),
        executorName: details.executorName.trim(),
      };
      if (willId) {
        await api.put(`/will/${willId}`, body);
        setGeneratedAt(null);
      } else {
        const res = await api.post('/will/create', body);
        setWillId(res.data.data.willId);
      }
      setSavedDetails(details);
      setStep('beneficiaries');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addBeneficiary = async (b: { name: string; relation: string }): Promise<boolean> => {
    if (!willId) return false;
    try {
      const res = await api.post(`/will/${willId}/beneficiary`, b);
      setBeneficiaries(list => [...list, { ...b, id: res.data.data.beneficiaryId }]);
      setGeneratedAt(null);
      toast.success(`${b.name} added`);
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  const removeBeneficiary = async (b: Beneficiary) => {
    if (!willId) return;
    const shares = allocations.filter(a => a.beneficiaryId === b.id).length;
    if (!window.confirm(shares
      ? `Remove ${b.name}? Their ${shares} asset allocation${shares > 1 ? 's' : ''} will also be removed.`
      : `Remove ${b.name}?`)) return;
    setBusyId(b.id);
    try {
      await api.delete(`/will/${willId}/beneficiary/${b.id}`);
      setBeneficiaries(list => list.filter(x => x.id !== b.id));
      setAllocations(list => list.filter(a => a.beneficiaryId !== b.id));
      setGeneratedAt(null);
      if (allocBeneficiaryId === b.id) setAllocBeneficiaryId('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const addAllocation = async () => {
    setAllocError('');
    if (!willId || !selectedAsset) return setAllocError('Select an asset.');
    if (assetKey === OTHER_ASSET && otherDescription.trim().length < 2) return setAllocError('Describe the asset (e.g. "22K gold chain, 40g").');
    const beneficiary = beneficiaries.find(b => b.id === allocBeneficiaryId);
    if (!beneficiary) return setAllocError('Select a beneficiary.');
    const pct = Number(allocPct);
    if (!Number.isFinite(pct) || pct <= 0) return setAllocError('Enter a share greater than 0%.');
    if (pct > remaining) {
      return setAllocError(remaining > 0 ? `Only ${remaining}% of this asset is left to allocate.` : 'This asset is already fully allocated.');
    }
    if (allocations.some(a => a.beneficiaryId === beneficiary.id &&
      (selectedAsset.refId ? a.assetRefId === selectedAsset.refId : !a.assetRefId && a.assetDescription.toLowerCase() === selectedAsset.name.toLowerCase()))) {
      return setAllocError(`${beneficiary.name} already has a share of this asset. Remove it first to change the percentage.`);
    }

    setSaving(true);
    try {
      const res = await api.post(`/will/${willId}/allocation`, {
        assetType: selectedAsset.type,
        ...(selectedAsset.refId ? { assetRefId: selectedAsset.refId } : {}),
        assetDescription: selectedAsset.name,
        estimatedValuePaise: selectedAsset.valuePaise,
        beneficiaryId: beneficiary.id,
        allocationPct: Math.round(pct * 100) / 100,
      });
      setAllocations(list => [...list, {
        id: res.data.data.allocationId,
        assetType: selectedAsset.type,
        assetRefId: selectedAsset.refId,
        assetDescription: selectedAsset.name,
        beneficiaryId: beneficiary.id,
        beneficiaryName: beneficiary.name,
        allocationPct: Math.round(pct * 100) / 100,
      }]);
      setGeneratedAt(null);
      setAssetKey('');
      setOtherDescription('');
      setAllocBeneficiaryId('');
      setAllocPct('');
    } catch (err: any) {
      setAllocError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAllocation = async (a: Allocation) => {
    if (!willId) return;
    setBusyId(a.id);
    try {
      await api.delete(`/will/${willId}/allocation/${a.id}`);
      setAllocations(list => list.filter(x => x.id !== a.id));
      setGeneratedAt(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const generatePDF = async () => {
    if (!willId) return;
    setGenerating(true);
    try {
      const res = await api.post(`/will/${willId}/generate-pdf`, {}, { responseType: 'blob' } as RequestInit);
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Will-${details.testatorName.trim().replace(/\s+/g, '-') || 'Codas'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setGeneratedAt(new Date().toISOString());
      toast.success('Your will PDF has been downloaded.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Group allocations by asset for the list view
  const allocationGroups = useMemo(() => {
    const groups = new Map<string, { name: string; items: Allocation[] }>();
    for (const a of allocations) {
      const key = a.assetRefId ?? `other:${a.assetDescription.toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, { name: a.assetDescription, items: [] });
      groups.get(key)!.items.push(a);
    }
    return [...groups.values()];
  }, [allocations]);

  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDetails(d => ({ ...d, [k]: e.target.value }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-100 dark:bg-lime-400/10">
          <Scale className="h-6 w-6 text-lime-700 dark:text-lime-400" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Digital Will Builder</h1>
          <p className="text-sm text-muted-foreground md:text-base">Record how your assets should be shared, and generate a will ready to sign.</p>
        </div>
      </header>

      {loadState === 'loading' && <CardSkeleton />}
      {loadState === 'error' && (
        <ErrorCard error={loadError} title="Couldn't load your will" onRetry={() => void load()} />
      )}

      {loadState === 'ready' && (
        <Card className="overflow-hidden py-0 gap-0">
          <Tabs value={step} onValueChange={(v) => stepEnabled[v as Step] && setStep(v as Step)} className="w-full gap-0">
            <div className="border-b border-border bg-muted/40 p-4 md:p-6">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:grid-cols-4">
                {([
                  ['details', FileText, '1. Details'],
                  ['beneficiaries', UserPlus, '2. Beneficiaries'],
                  ['assets', Scale, '3. Assets'],
                  ['review', Check, '4. Review & sign'],
                ] as const).map(([value, Icon, label]) => (
                  <TabsTrigger key={value} value={value} disabled={!stepEnabled[value]} className="py-2">
                    <Icon className="mr-2 h-4 w-4" aria-hidden="true" /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <CardContent className="p-6 md:p-8">
              {/* ── Step 1 */}
              <TabsContent value="details" className="m-0 space-y-6 focus-visible:outline-none">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <p>Your identity is already verified with Aadhaar, so we don't ask for your Aadhaar number here.</p>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <section className="space-y-4">
                    <div className="border-b border-border pb-2">
                      <h2 className="text-lg font-semibold text-foreground">You (testator)</h2>
                      <p className="text-xs text-muted-foreground">As these details should appear in your will.</p>
                    </div>
                    <Field id="testatorName" label="Full legal name *" error={showError('testatorName')}>
                      <Input id="testatorName" value={details.testatorName} maxLength={200} onChange={set('testatorName')} aria-invalid={!!showError('testatorName')} />
                    </Field>
                    <Field id="testatorDob" label="Date of birth *" error={showError('testatorDob')}>
                      <Input id="testatorDob" type="date" min="1900-01-01" max={maxAdultDob()} value={details.testatorDob} onChange={set('testatorDob')} aria-invalid={!!showError('testatorDob')} />
                    </Field>
                    <Field id="testatorPan" label="PAN (optional)" error={showError('testatorPan')}>
                      <Input id="testatorPan" value={details.testatorPan} maxLength={10} placeholder="ABCDE1234F" autoCapitalize="characters"
                        onChange={(e) => setDetails(d => ({ ...d, testatorPan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                        aria-invalid={!!showError('testatorPan')} />
                    </Field>
                    <Field id="testatorAddress" label="Residential address *" error={showError('testatorAddress')}>
                      <textarea id="testatorAddress" rows={3} maxLength={500} value={details.testatorAddress} onChange={set('testatorAddress')}
                        aria-invalid={!!showError('testatorAddress')}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive" />
                    </Field>
                  </section>

                  <section className="space-y-4">
                    <div className="border-b border-border pb-2">
                      <h2 className="text-lg font-semibold text-foreground">Executor</h2>
                      <p className="text-xs text-muted-foreground">The person who will carry out your will.</p>
                    </div>
                    <Field id="executorName" label="Full name *" error={showError('executorName')}>
                      <Input id="executorName" value={details.executorName} maxLength={200} onChange={set('executorName')} aria-invalid={!!showError('executorName')} />
                    </Field>
                    <Field id="executorRelation" label="Relationship to you *" error={showError('executorRelation')}>
                      <select id="executorRelation" value={details.executorRelation} onChange={set('executorRelation')} className={selectClass} aria-invalid={!!showError('executorRelation')}>
                        <option value="">Select relationship</option>
                        {[...RELATIONSHIPS, 'Lawyer'].map(r => <option key={r} value={r}>{r}</option>)}
                        {details.executorRelation && ![...RELATIONSHIPS, 'Lawyer'].includes(details.executorRelation) && (
                          <option value={details.executorRelation}>{details.executorRelation}</option>
                        )}
                      </select>
                    </Field>
                    <Field id="executorMobile" label="Mobile number *" error={showError('executorMobile')} hint="10-digit Indian mobile number">
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                        <Input id="executorMobile" inputMode="numeric" autoComplete="tel-national" className="rounded-l-none" value={details.executorMobile}
                          onChange={(e) => setDetails(d => ({ ...d, executorMobile: normaliseMobile(e.target.value) }))}
                          aria-invalid={!!showError('executorMobile')} />
                      </div>
                    </Field>
                  </section>
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                  <Button onClick={saveDetails} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {willId && !detailsDirty ? 'Continue' : 'Save & continue'}
                  </Button>
                </div>
              </TabsContent>

              {/* ── Step 2 */}
              <TabsContent value="beneficiaries" className="m-0 space-y-6 focus-visible:outline-none">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Who should inherit?</h2>
                  <p className="text-sm text-muted-foreground">Add everyone you want to leave something to. You'll assign assets in the next step.</p>
                </div>

                <WillBeneficiaryForm existingNames={beneficiaries.map(b => b.name)} onAdd={addBeneficiary} />

                {beneficiaries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Beneficiaries ({beneficiaries.length})</h3>
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {beneficiaries.map(b => (
                        <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{b.name}</p>
                            <p className="text-sm text-muted-foreground">{b.relation}</p>
                          </div>
                          <Button variant="ghost" size="icon" aria-label={`Remove ${b.name}`} disabled={busyId === b.id} onClick={() => removeBeneficiary(b)}>
                            {busyId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between border-t border-border pt-6">
                  <Button variant="ghost" onClick={() => setStep('details')}>Back</Button>
                  <Button onClick={() => setStep('assets')} disabled={beneficiaries.length === 0}>Continue to assets</Button>
                </div>
              </TabsContent>

              {/* ── Step 3 */}
              <TabsContent value="assets" className="m-0 space-y-6 focus-visible:outline-none">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Allocate your assets</h2>
                  <p className="text-sm text-muted-foreground">Choose an asset and the share each beneficiary receives. An asset can be split between people, up to 100%.</p>
                </div>

                <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-5 md:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="space-y-2 md:col-span-5">
                      <Label htmlFor="alloc-asset">Asset *</Label>
                      <select id="alloc-asset" value={assetKey} onChange={(e) => { setAssetKey(e.target.value); setAllocError(''); }} className={selectClass}>
                        <option value="">Select an asset</option>
                        {assetOptions.length > 0 && (
                          <optgroup label="Your synced assets">
                            {assetOptions.map(a => {
                              const left = 100 - allocatedFor(a.refId, a.name);
                              return <option key={a.key} value={a.key} disabled={left <= 0}>{a.name}{left < 100 ? ` — ${left}% left` : ''}</option>;
                            })}
                          </optgroup>
                        )}
                        <option value={OTHER_ASSET}>Other asset (gold, vehicle, …)</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <Label htmlFor="alloc-ben">Beneficiary *</Label>
                      <select id="alloc-ben" value={allocBeneficiaryId} onChange={(e) => { setAllocBeneficiaryId(e.target.value); setAllocError(''); }} className={selectClass}>
                        <option value="">Select beneficiary</option>
                        {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name} ({b.relation})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="alloc-pct">Share (%) *</Label>
                      <Input id="alloc-pct" type="number" inputMode="decimal" min={1} max={remaining || 100} step="any"
                        value={allocPct} onChange={(e) => { setAllocPct(e.target.value); setAllocError(''); }} />
                    </div>

                    {assetKey === OTHER_ASSET && (
                      <>
                        <div className="space-y-2 md:col-span-8">
                          <Label htmlFor="alloc-desc">Describe the asset *</Label>
                          <Input id="alloc-desc" maxLength={300} placeholder='e.g. "22K gold necklace, 40g" or "Maruti Swift DL01AB1234"'
                            value={otherDescription} onChange={(e) => { setOtherDescription(e.target.value); setAllocError(''); }} />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                          <Label htmlFor="alloc-type">Type</Label>
                          <select id="alloc-type" value={otherType} onChange={(e) => setOtherType(e.target.value)} className={selectClass}>
                            {OTHER_ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {assetKey && selectedAsset?.name && (
                    <p className="text-xs text-muted-foreground">{remaining}% of this asset is still unallocated.</p>
                  )}
                  {allocError && <p role="alert" className="text-sm text-destructive">{allocError}</p>}

                  <Button variant="outline" onClick={addAllocation} disabled={saving || !assetKey || !allocBeneficiaryId}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add allocation
                  </Button>
                </div>

                {allocationGroups.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Allocations</h3>
                    {allocationGroups.map(g => {
                      const total = g.items.reduce((s, a) => s + a.allocationPct, 0);
                      return (
                        <div key={g.name} className="rounded-lg border border-border bg-card">
                          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <p className="min-w-0 truncate font-medium text-foreground">{g.name}</p>
                            <span className={`shrink-0 text-xs font-semibold ${total >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {total}% allocated
                            </span>
                          </div>
                          <ul className="divide-y divide-border">
                            {g.items.map(a => (
                              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                <span className="text-foreground">{a.beneficiaryName}</span>
                                <span className="ml-auto font-semibold text-lime-700 dark:text-lime-400">{a.allocationPct}%</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${a.beneficiaryName}'s share of ${g.name}`}
                                  disabled={busyId === a.id} onClick={() => removeAllocation(a)}>
                                  {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {allocations.length > 0 && unallocatedBeneficiaries.length > 0 && (
                  <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {unallocatedBeneficiaries.map(b => b.name).join(', ')} {unallocatedBeneficiaries.length > 1 ? "don't" : "doesn't"} have any assets yet.
                  </p>
                )}

                <div className="flex justify-between border-t border-border pt-6">
                  <Button variant="ghost" onClick={() => setStep('beneficiaries')}>Back</Button>
                  <Button onClick={() => setStep('review')} disabled={allocations.length === 0}>Review will</Button>
                </div>
              </TabsContent>

              {/* ── Step 4 */}
              <TabsContent value="review" className="m-0 space-y-6 focus-visible:outline-none">
                <WillPreview
                  details={details}
                  beneficiaries={beneficiaries}
                  allocations={allocations}
                  onGenerate={generatePDF}
                  generating={generating}
                  generatedAt={generatedAt}
                />
                <div className="flex justify-start border-t border-border pt-6">
                  <Button variant="ghost" onClick={() => setStep('assets')}>Back to assets</Button>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
