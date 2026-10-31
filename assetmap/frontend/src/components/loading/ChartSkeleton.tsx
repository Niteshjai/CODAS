import { Skeleton } from './Skeleton'

const BAR_HEIGHTS = [70, 45, 90, 60, 80, 50, 75, 65, 85, 55, 70, 80]

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
      className={`skeleton-surface ${className}`}
      style={{ padding:20 }}
    >
      <div style={{ display:'flex', justifyContent:'space-between',
                   marginBottom:16 }}>
        <Skeleton width={100} height={13} />
        <Skeleton width={60}  height={13} />
      </div>
      <div style={{ display:'flex', alignItems:'flex-end',
                   gap:6, height:140 }}>
        {BAR_HEIGHTS.map((h, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${h}%`}
            radius={4}
            style={{ flexShrink:1 }}
          />
        ))}
      </div>
      <span className="sr-only">Loading chart...</span>
    </div>
  )
}
