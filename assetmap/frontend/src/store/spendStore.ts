import { create } from 'zustand'
import { api } from '../services/api'
import type { SpendCategory, SpendStatus } from '../components/spend/types'

/**
 * Shared Spend Analyser state: the data status (drives the empty state + month list), the
 * category catalogue, the selected month, and a revision counter every tab watches so a
 * correction / analysis / profile change refreshes whatever is on screen.
 */
interface SpendState {
  status: SpendStatus | null
  statusError: unknown
  statusLoading: boolean
  categories: SpendCategory[]
  month: string | null
  revision: number
  /** When the user last changed something insights depend on (corrections, needs, budgets). */
  changedAt: number | null
  loadStatus: () => Promise<SpendStatus | null>
  loadCategories: () => Promise<void>
  setMonth: (month: string) => void
  /** Something changed server-side: refetch status and let every tab reload. */
  invalidate: () => void
  /** The user changed data the stored insights were written from; they're now possibly out of date. */
  markChanged: () => void
  clearChanged: () => void
}

export const useSpendStore = create<SpendState>((set, get) => ({
  status: null,
  statusError: null,
  statusLoading: false,
  categories: [],
  month: null,
  revision: 0,
  changedAt: null,

  loadStatus: async () => {
    set({ statusLoading: true, statusError: null })
    try {
      const res = await api.get('/spend/status')
      const status = res.data.data as SpendStatus
      const current = get().month
      const months = status.months.map((m) => m.month)
      // Keep the chosen month while it still has data; otherwise jump to the latest month
      const month = current && months.includes(current) ? current : status.latestMonth
      set({ status, month, statusLoading: false })
      return status
    } catch (err) {
      set({ statusError: err, statusLoading: false })
      return null
    }
  },

  loadCategories: async () => {
    if (get().categories.length) return
    try {
      const res = await api.get('/spend/categories')
      set({ categories: res.data.data as SpendCategory[] })
    } catch {
      // Pickers fall back to the labels the API already sends with each row
    }
  },

  setMonth: (month) => set({ month }),

  invalidate: () => {
    set((s) => ({ revision: s.revision + 1 }))
    void get().loadStatus()
  },

  markChanged: () => set({ changedAt: Date.now() }),
  clearChanged: () => set({ changedAt: null }),
}))

export const categoryById = (categories: SpendCategory[], id: string | null | undefined) =>
  categories.find((c) => c.id === id)
