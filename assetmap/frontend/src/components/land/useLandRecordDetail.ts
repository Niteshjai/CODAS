import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

export interface LandMutation {
  id: string;
  mutationNumber: string | null;
  mutationType: string | null;
  mutationDate: string | null;
  fromOwner: string | null;
  toOwner: string | null;
  areaTransferred: string | number | null;
  remarks: string | null;
}

export interface LandEncumbrance {
  id: string;
  encumbranceType: string | null;
  creditorName: string | null;
  amountPaise: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
}

/** Shape of GET /assets/land/:id (snake_case columns + decrypted camelCase fields) */
export interface LandRecordDetail {
  id: string;
  surveyNumber: string | null;
  khasraNumber: string | null;
  plotNumber: string | null;
  ownerName: string | null;
  registrationNumber: string | null;
  disputeDetails: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
  pin_code: string | null;
  area_value: string | number | null;
  area_unit: string | null;
  land_type: string | null;
  land_use: string | null;
  ownership_type: string | null;
  co_owners_count: number | null;
  title_status: string | null;
  mutation_status: string | null;
  encumbrance_status: string | null;
  registration_date: string | null;
  sub_registrar_office: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  ulpin: string | null;
  estimated_value_paise: string | number | null;
  circle_rate_paise: string | number | null;
  valuation_date: string | null;
  valuation_source: string | null;
  digilocker_doc_available: boolean | null;
  doc_last_fetched_at: string | null;
  source: string | null;
  is_verified: boolean | null;
  verified_at: string | null;
  fetched_at: string | null;
  last_synced_at: string | null;
  next_sync_at: string | null;
  sync_frequency_days: number | null;
  is_stale: boolean | null;
  notes: string | null;
  mutations: LandMutation[];
  encumbrances: LandEncumbrance[];
}

// Detail rarely changes while a session is open: share it between the record and valuation dialogs
const cache = new Map<string, LandRecordDetail>();

export function useLandRecordDetail(recordId: string | null, enabled: boolean) {
  const [detail, setDetail] = useState<LandRecordDetail | null>(recordId ? cache.get(recordId) ?? null : null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!recordId || !enabled) return;
    const hit = cache.get(recordId);
    if (hit) { setDetail(hit); setError(null); return; }

    let cancelled = false;
    setDetail(null);
    setLoading(true);
    setError(null);
    api.get<any>(`/assets/land/${recordId}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data as LandRecordDetail;
        cache.set(recordId, data);
        setDetail(data);
      })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [recordId, enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { detail, error, loading, retry };
}

export const paiseToRupees = (v: string | number | null | undefined): number | null => {
  const n = Number(v);
  return v != null && Number.isFinite(n) && n > 0 ? n / 100 : null;
};
