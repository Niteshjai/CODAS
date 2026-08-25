import { Skeleton } from './Skeleton'
import React from 'react'

export function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:12, padding:20
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between',
                   marginBottom:16 }}>
        <Skeleton width={100} height={13} />
        <Skeleton width={60}  height={13} />
      </div>
      <div style={{ display:'flex', alignItems:'flex-end',
                   gap:6, height:140 }}>
        {[70,45,90,60,80,50,75,65,85,55,70,80].map((h, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`%`}
            radius={4}
            style={{ flexShrink:1 }}
          />
        ))}
      </div>
      <span className="sr-only">Loading chart...</span>
    </div>
  )
}
