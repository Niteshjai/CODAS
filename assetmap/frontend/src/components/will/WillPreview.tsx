import { Button } from '@/components/ui/button';
import { FileDown, Loader2, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  details: {
    testatorName: string;
    testatorDob: string;
    testatorAddress: string;
    testatorPan: string;
    executorName: string;
    executorRelation: string;
  };
  beneficiaries: { id: string; name: string; relation: string }[];
  allocations: { id: string; beneficiaryId: string | null; beneficiaryName: string; assetDescription: string; allocationPct: number }[];
  onGenerate: () => void;
  generating: boolean;
  generatedAt: string | null;
}

function formatDob(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export default function WillPreview({ details, beneficiaries, allocations, onGenerate, generating, generatedAt }: Props) {
  const byBeneficiary = beneficiaries.map(b => ({
    ...b,
    items: allocations.filter(a => (a.beneficiaryId ? a.beneficiaryId === b.id : a.beneficiaryName === b.name)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
        <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p>
          Review the details below. To be legally valid under the Indian Succession Act, 1925, print the generated PDF and
          sign it in the presence of two adult witnesses who are <strong>not</strong> beneficiaries.
        </p>
      </div>

      <article className="mx-auto max-w-3xl rounded-sm border border-border bg-card p-6 text-card-foreground shadow-xl md:p-10">
        <header className="mb-8 border-b-2 border-border pb-4 text-center">
          <h3 className="font-serif text-2xl font-bold uppercase tracking-wider md:text-3xl">Last Will and Testament</h3>
          <p className="mt-2 font-serif text-lg">of {details.testatorName}</p>
        </header>

        <div className="space-y-6 font-serif leading-relaxed">
          <p>
            I, <strong>{details.testatorName}</strong>, born on {formatDob(details.testatorDob)}, residing at{' '}
            {details.testatorAddress}{details.testatorPan && <>, holding PAN {details.testatorPan}</>}, being of sound mind
            and memory, declare this to be my last Will and revoke all my earlier wills and codicils.
          </p>

          <section>
            <h4 className="mb-2 text-lg font-bold">1. Appointment of Executor</h4>
            <p>
              I appoint <strong>{details.executorName}</strong> ({details.executorRelation}) as the Executor of this Will.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-lg font-bold">2. Bequests</h4>
            <div className="space-y-4">
              {byBeneficiary.map(b => (
                <div key={b.id}>
                  <p className="font-semibold">{b.name} <span className="font-normal text-muted-foreground">({b.relation})</span></p>
                  {b.items.length ? (
                    <ul className="mt-1 list-disc space-y-1 pl-6">
                      {b.items.map(a => <li key={a.id}>{a.allocationPct}% of {a.assetDescription}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-1 pl-6 italic text-muted-foreground">No specific assets allocated.</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4">Any assets not mentioned above shall be distributed in accordance with applicable law.</p>
          </section>

          <section className="space-y-8 pt-4">
            <h4 className="text-lg font-bold">3. Signatures</h4>
            <div className="w-56 text-center">
              <div className="mb-2 border-b border-foreground" />
              <p className="font-bold">{details.testatorName}</p>
              <p className="text-sm text-muted-foreground">Testator</p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {[1, 2].map(n => (
                <div key={n} className="text-center">
                  <div className="mb-2 border-b border-foreground" />
                  <p className="text-sm text-muted-foreground">Witness {n} — name &amp; signature</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button size="lg" onClick={onGenerate} disabled={generating} className="font-semibold">
          {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
          {generatedAt ? 'Download PDF again' : 'Generate & download PDF'}
        </Button>
        {generatedAt && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Generated {new Date(generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}
      </div>
    </div>
  );
}
