import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';

export const RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Grandchild', 'Friend', 'Other'];

interface Props {
  existingNames: string[];
  onAdd: (beneficiary: { name: string; relation: string }) => Promise<boolean>;
}

export const selectClass =
  'w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50';

export default function WillBeneficiaryForm({ existingNames, onAdd }: Props) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanName = name.trim().replace(/\s+/g, ' ');

    if (cleanName.length < 2) return setError("Enter the beneficiary's full legal name.");
    if (!/^[\p{L} .'-]+$/u.test(cleanName)) return setError('Names can only contain letters, spaces, dots, hyphens and apostrophes.');
    if (!relation) return setError('Select how they are related to you.');
    if (existingNames.some(n => n.toLowerCase() === cleanName.toLowerCase())) return setError(`${cleanName} is already added.`);

    setSaving(true);
    const ok = await onAdd({ name: cleanName, relation });
    setSaving(false);
    if (ok) {
      setName('');
      setRelation('');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-border bg-muted/40 p-5 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ben-name">Full legal name *</Label>
          <Input
            id="ben-name"
            value={name}
            maxLength={200}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            placeholder="As it appears on their ID"
            aria-invalid={!!error && name.trim().length < 2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ben-relation">Relationship to you *</Label>
          <select id="ben-relation" value={relation} onChange={(e) => setRelation(e.target.value)} className={selectClass}>
            <option value="">Select relationship</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="outline" disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
        Add beneficiary
      </Button>
    </form>
  );
}
