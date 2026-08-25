import { Skeleton } from './Skeleton'
import React from 'react'

interface Props { rows?: number }

export function CardSkeleton({ rows = 3 }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:12, padding:16
      }}
    >
      <Skeleton width="40%" height={13} style={{ marginBottom:12 }} />
      <Skeleton width="70%" height={22} style={{ marginBottom:8 }} />
      {Array.from({ length:rows }).map((_, i) => (
        <Skeleton
          key={i}
          width={`%`}
          height={12}
          style={{ marginBottom:6 }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
