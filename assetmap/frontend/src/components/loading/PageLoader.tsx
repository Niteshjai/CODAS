import { Spinner } from '../ui/Spinner'
import React from 'react'

interface Props {
  message?: string
  fullPage?: boolean
}

export function PageLoader({
  message  = 'Loading...',
  fullPage = false
}: Props) {
  return (
    <div
      role="status"
      aria-label={message}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        padding:        '60px 20px',
        minHeight:      fullPage ? '100vh' : 200,
        color:          'var(--text-muted, #71717a)',
      }}
    >
      <Spinner size={28} />
      <span style={{ fontSize:13, color:'var(--text-muted, #71717a)' }}>
        {message}
      </span>
    </div>
  )
}
