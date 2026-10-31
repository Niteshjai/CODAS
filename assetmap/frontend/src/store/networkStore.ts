import { create } from 'zustand'

const API_BASE_URL  = import.meta.env.VITE_API_URL || ''
const PROBE_TIMEOUT = 5000
const MAX_BACKOFF   = 30000

// Three distinct problems, each shown differently:
//   isOnline=false        → device has no network at all (browser offline event)
//   serverReachable=false → device is "online" but AssetMap can't be reached
//                           (captive Wi-Fi, ISP issue, API down)
//   isSlow=true           → requests work but are slow (2G / congested network)
interface NetworkStore {
  isOnline:        boolean
  serverReachable: boolean
  isSlow:          boolean
  offlineSince:    Date | null
  reconnectCount:  number   // bumps each time connectivity is restored after a failure
  checking:        boolean
  staleData:       boolean  // a data load (GET) failed during the outage → reload view on reconnect

  setOnline:       () => void
  setOffline:      () => void
  setSlow:         (slow: boolean) => void
  reportRequestFailure: (isRead?: boolean) => void
  consumeStaleData:     () => boolean
  reportRequestSuccess: () => void
  checkConnectivity:    () => Promise<boolean>
}

let probeTimer: ReturnType<typeof setTimeout> | null = null
let backoff = 5000

async function probeServer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache:  'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
    })
    // Any HTTP answer (even 503) proves the network path works
    return res.status > 0
  } catch {
    return false
  }
}

export const useNetworkStore = create<NetworkStore>((set, get) => {
  const markDown = () => {
    if (get().serverReachable) {
      set({ serverReachable: false, offlineSince: get().offlineSince ?? new Date() })
    }
    scheduleProbe()
  }

  const markUp = () => {
    const wasDown = !get().serverReachable
    backoff = 5000
    if (probeTimer) { clearTimeout(probeTimer); probeTimer = null }
    if (wasDown) {
      set(s => ({ serverReachable: true, offlineSince: null, reconnectCount: s.reconnectCount + 1 }))
    }
  }

  // Keep re-probing with exponential backoff until the server answers
  const scheduleProbe = () => {
    if (probeTimer || !get().isOnline) return
    probeTimer = setTimeout(async () => {
      probeTimer = null
      const ok = await probeServer()
      if (ok) markUp()
      else {
        backoff = Math.min(backoff * 2, MAX_BACKOFF)
        scheduleProbe()
      }
    }, backoff)
  }

  return {
    isOnline:        typeof navigator === 'undefined' ? true : navigator.onLine,
    serverReachable: true,
    isSlow:          false,
    offlineSince:    null,
    reconnectCount:  0,
    checking:        false,
    staleData:       false,

    setOnline: () => {
      set({ isOnline: true })
      // The browser's "online" only means a network interface is up; confirm the API answers
      void get().checkConnectivity()
    },

    setOffline: () => {
      if (probeTimer) { clearTimeout(probeTimer); probeTimer = null }
      set(s => ({
        isOnline:        false,
        serverReachable: false,
        offlineSince:    s.offlineSince ?? new Date(),
      }))
    },

    setSlow: (slow) => { if (get().isSlow !== slow) set({ isSlow: slow }) },

    reportRequestFailure: (isRead = false) => {
      if (isRead && !get().staleData) set({ staleData: true })
      markDown()
    },
    consumeStaleData: () => {
      const stale = get().staleData
      if (stale) set({ staleData: false })
      return stale
    },
    reportRequestSuccess: () => { if (!get().serverReachable) markUp() },

    checkConnectivity: async () => {
      if (!navigator.onLine) { get().setOffline(); return false }
      set({ checking: true })
      const ok = await probeServer()
      set({ checking: false })
      if (ok) markUp()
      else markDown()
      return ok
    },
  }
})
