import { useEffect, useRef } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { toast }           from '../store/toastStore'

type NetworkInformation = EventTarget & { effectiveType?: string; saveData?: boolean }

function getConnection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection
}

function isSlowConnection(c?: NetworkInformation): boolean {
  return !!c && (c.saveData === true || c.effectiveType === 'slow-2g' || c.effectiveType === '2g')
}

/** Mount once (App). Wires browser connectivity signals into the network store. */
export function useNetworkStatus(): {
  isOnline:        boolean
  serverReachable: boolean
  isSlow:          boolean
  offlineSince:    Date | null
} {
  const { isOnline, serverReachable, isSlow, offlineSince, reconnectCount } = useNetworkStore()
  const lastReconnect = useRef(reconnectCount)

  useEffect(() => {
    const { setOnline, setOffline, setSlow, checkConnectivity } = useNetworkStore.getState()

    const handleOnline  = () => setOnline()
    const handleOffline = () => setOffline()

    const connection = getConnection()
    const handleConnectionChange = () => setSlow(isSlowConnection(connection))
    handleConnectionChange()

    // Returning to a backgrounded tab is when stale connectivity state is most likely
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !useNetworkStore.getState().serverReachable) {
        void checkConnectivity()
      }
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    connection?.addEventListener('change', handleConnectionChange)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      connection?.removeEventListener('change', handleConnectionChange)
    }
  }, [])

  // One "back online" toast per recovery; the banner covers the outage itself
  useEffect(() => {
    if (reconnectCount > lastReconnect.current) {
      toast.success('Back online', 'Your connection is restored. Refreshing your data.')
      window.dispatchEvent(new CustomEvent('network-restored'))
    }
    lastReconnect.current = reconnectCount
  }, [reconnectCount])

  return { isOnline, serverReachable, isSlow, offlineSince }
}
