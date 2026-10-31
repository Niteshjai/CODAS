import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, EyeOff, Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useFamilyStore, type Member, type MemberAssets } from '../../store/familyStore';
import { ErrorCard } from '../errors/ErrorCard';
import { MemberAvatar } from './FamilyMemberCard';
import { assetClassLabel, relationshipLabel, rupees, rupeesCompact, timeAgo } from './familyUi';

export default function MemberAssetsSheet({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const fetchMemberAssets = useFamilyStore((s) => s.fetchMemberAssets);
  const [data, setData] = useState<MemberAssets | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetchMemberAssets(member.id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [member, attempt, fetchMemberAssets]);

  const total = data ? Object.values(data.summary).reduce((s, v) => s + v, 0) : 0;
  const classes = data ? Object.entries(data.summary).sort((a, b) => b[1] - a[1]) : [];

  return (
    <Sheet open={!!member} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[30rem] overflow-y-auto bg-background border-border p-0">
        {member && (
          <>
            <SheetHeader className="p-6 border-b border-border text-left space-y-0">
              <div className="flex items-center gap-3 pr-8">
                <MemberAvatar name={member.displayName} color={member.avatarColor} size="lg" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-semibold text-foreground truncate">
                    {member.displayName}{member.isYou ? ' (you)' : ''}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {relationshipLabel(member.relationship)} · what they share with the family
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {loading && (
                <div className="space-y-3" aria-busy="true" aria-label="Loading shared assets">
                  <div className="h-20 rounded-2xl bg-muted animate-pulse" />
                  {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted/70 animate-pulse" />)}
                </div>
              )}

              {error != null && !loading && (
                <ErrorCard error={error} compact title="Couldn't load shared assets" onRetry={() => setAttempt(a => a + 1)} />
              )}

              {data?.sharesNothing && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <EyeOff className="size-6 mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Not sharing any assets</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.isYou ? 'Turn sharing on from "What you share".' : `${member.displayName.split(' ')[0]} has chosen to keep their assets private.`}
                  </p>
                </div>
              )}

              {data && !data.sharesNothing && (
                <>
                  <div className="rounded-2xl bg-muted/50 border border-border p-5">
                    <p className="text-xs font-medium text-muted-foreground">Total shared</p>
                    <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums mt-1">{rupeesCompact(total)}</p>
                    {classes.length > 0 && (
                      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        {classes.map(([cls, v], i) => (
                          <div key={cls} style={{ width: `${(v / (total || 1)) * 100}%`, backgroundColor: `hsl(${(i * 67 + 90) % 360} 55% 50%)` }} />
                        ))}
                      </div>
                    )}
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {classes.map(([cls, v], i) => (
                        <li key={cls} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: `hsl(${(i * 67 + 90) % 360} 55% 50%)` }} />
                            <span className="truncate">{assetClassLabel(cls)}</span>
                          </span>
                          <span className="font-medium text-foreground tabular-nums">{rupeesCompact(v)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Accounts ({data.assets.length})
                    </h3>
                    {data.assets.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        No linked accounts in the asset types they share.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                        {data.assets.map(a => (
                          <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
                              <Building2 className="size-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{a.institution_name}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                {assetClassLabel(a.asset_class)}
                                {a.has_nominee === true && <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="size-3" />Nominee</span>}
                                {a.has_nominee === false && <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><ShieldAlert className="size-3" />No nominee</span>}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-foreground tabular-nums">{rupees(a.current_value_paise)}</p>
                              {a.last_synced_at && <p className="text-[10px] text-muted-foreground">{timeAgo(a.last_synced_at)}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">Account and folio numbers are never shared.</p>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
