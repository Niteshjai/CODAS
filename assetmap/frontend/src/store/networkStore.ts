import { create } from 'zustand'

interface NetworkStore {
  isOnline:        boolean
  wasOffline:      boolean  // just came back online
  offlineSince:    Date | null
  setOnline:       () => void
  setOffline:      () => void
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  isOnline:     navigator.onLine,
  wasOffline:   false,
  offlineSince: null,

  setOnline: () => {
    const { isOnline } = get()
    set({ isOnline:true, wasOffline:!isOnline, offlineSince:null })
    // Clear wasOffline after showing "back online" toast
    setTimeout(() => set({ wasOffline:false }), 4000)
  },

  setOffline: () => set({
    isOnline:    false,
    offlineSince:new Date(),
    wasOffline:  false,
  }),
}))
