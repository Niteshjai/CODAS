import { useEffect } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { toast }           from '../store/toastStore'

export function useNetworkStatus(): {
  isOnline:     boolean
  wasOffline:   boolean
  offlineSince: Date | null
} {
  const { isOnline, wasOffline, offlineSince, setOnline, setOffline } =
    useNetworkStore()

  useEffect(() => {
    const handleOnline = () => {
      setOnline()
      toast.success(
        'Back online',
        'Your connection is restored. Data will refresh.'
      )
      if (wasOffline) {
        window.dispatchEvent(new CustomEvent('network-restored'))
      }
    }

    const handleOffline = () => {
      setOffline()
      toast.warning(
        'No internet connection',
        'Changes will not save until you reconnect.',
      )
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline, setOnline, setOffline])

  return { isOnline, wasOffline, offlineSince }
}
