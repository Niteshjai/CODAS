import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id:       string
  type:     ToastType
  title:    string
  message?: string
  duration: number    // ms, 0 = persistent
  action?:  { label: string; onClick: () => void }
}

interface ToastStore {
  toasts:  Toast[]
  add:     (toast: Omit<Toast,'id' | 'duration'> & { duration?:number }) => string
  remove:  (id: string) => void
  clear:   () => void
}

let counter = 0

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  add: (params) => {
    const id       = `toast-${++counter}`
    const duration = params.duration ?? (params.type === 'error' ? 6000 : 4000)
    const toast: Toast = { id, duration, ...params }

    const { toasts } = get()
    // Deduplication
    if (toasts.some(t => t.title === toast.title && t.message === toast.message)) {
      return id
    }

    set(state => ({
      toasts: [...state.toasts.slice(-4), toast]  // max 5 toasts
    }))

    if (duration > 0) {
      setTimeout(() => get().remove(id), duration)
    }

    return id
  },

  remove: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  clear: () => set({ toasts: [] }),
}))

// Convenience helpers
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().add({ type:'success', title, message }),
  error:   (title: string, message?: string) =>
    useToastStore.getState().add({ type:'error',   title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().add({ type:'warning', title, message }),
  info:    (title: string, message?: string) =>
    useToastStore.getState().add({ type:'info',    title, message }),
}
