import { useNetworkStore } from '../../store/networkStore'
import React from 'react'

export function OfflineBanner() {
  const { isOnline, offlineSince } = useNetworkStore()

  if (isOnline) return null

  const duration = offlineSince
    ? Math.floor((Date.now() - offlineSince.getTime()) / 1000)
    : 0

  const durationText = duration > 60
    ? `${Math.floor(duration / 60)} minute${Math.floor(duration / 60) !== 1 ? 's' : ''} ago`
    : `${duration} second${duration !== 1 ? 's' : ''} ago`

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position:       'sticky',
        top:            0,
        zIndex:         200,
        background:     '#FAEEDA',
        borderBottom:   '1px solid #FAC775',
        padding:        '10px 20px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            10,
        fontSize:       13,
        color:          '#412402',
      }}
    >
      <span style={{ fontSize:16 }}>📡</span>
      <span>
        <strong>No internet connection</strong>
        {offlineSince && duration > 5 && ` · Offline since ${durationText}`}
        {' '}— Showing cached data. Some features may not work.
      </span>
    </div>
  )
}
