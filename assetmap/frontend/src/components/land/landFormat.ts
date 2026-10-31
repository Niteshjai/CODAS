// Shared formatting for land/property views

export type LandUnit = 'acres' | 'hectares' | 'sqft' | 'sqm' | 'bigha' | 'guntha' | 'cent';

export const UNIT_LABELS: Record<LandUnit, string> = {
  acres: 'Acres',
  hectares: 'Hectares',
  sqft: 'Sq. Ft',
  sqm: 'Sq. Meters',
  bigha: 'Bigha',
  guntha: 'Guntha',
  cent: 'Cent',
};

// How many of each unit make up one acre
const PER_ACRE: Record<LandUnit, number> = {
  acres: 1, hectares: 0.404686, sqft: 43560, sqm: 4046.86, bigha: 1.6, guntha: 40, cent: 100,
};

const SINGULAR: Record<LandUnit, string> = {
  acres: 'acre', hectares: 'hectare', sqft: 'sq.ft', sqm: 'sq.m', bigha: 'bigha', guntha: 'guntha', cent: 'cent',
};

export function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Full rupee amount with Indian grouping, e.g. ₹1,50,00,000 */
export function formatINRFull(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatArea(rawAcres: number | string, targetUnit: LandUnit): string {
  const acres = Number(rawAcres) || 0;
  switch (targetUnit) {
    case 'hectares': return `${(acres * 0.404686).toFixed(2)} ha`;
    case 'sqft': return `${Math.round(acres * 43560).toLocaleString('en-IN')} sq.ft`;
    case 'sqm': return `${Math.round(acres * 4046.86).toLocaleString('en-IN')} sq.m`;
    case 'bigha': return `${(acres * 1.6).toFixed(2)} Bigha`; // approx standard
    case 'guntha': return `${(acres * 40).toFixed(1)} Guntha`;
    case 'cent': return `${(acres * 100).toFixed(1)} Cent`;
    case 'acres':
    default: return `${acres.toFixed(2)} Acres`;
  }
}

/** Rupees per one display unit, or null when the area is unknown */
export function valuePerUnit(valueRupees: number, areaAcres: number, unit: LandUnit): number | null {
  const units = (Number(areaAcres) || 0) * PER_ACRE[unit];
  return units > 0 && valueRupees > 0 ? valueRupees / units : null;
}

export const unitSingular = (unit: LandUnit) => SINGULAR[unit];

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SOURCE_LABELS: Record<string, string> = {
  dilrmp: 'DILRMP land records',
  igr: 'IGR registration records',
  surepass: 'State land records (via Surepass)',
  bhulekh: 'Bhulekh land records',
  digilocker: 'DigiLocker',
  manual: 'Added by you',
};

export const sourceLabel = (source?: string | null) =>
  (source && SOURCE_LABELS[source.toLowerCase()]) || (source ? source.toUpperCase() : 'Unknown source');

export const humanise = (v?: string | null) =>
  v ? v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : null;
