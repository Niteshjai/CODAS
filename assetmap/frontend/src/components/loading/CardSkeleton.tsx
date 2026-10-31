import { Skeleton } from './Skeleton'

interface Props { rows?: number; className?: string }

const ROW_WIDTHS = ['90%', '75%', '82%', '60%', '70%']

export function CardSkeleton({ rows = 3, className = '' }: Props) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={`skeleton-surface ${className}`}
      style={{ padding:16 }}
    >
      <Skeleton width="40%" height={13} style={{ marginBottom:12 }} />
      <Skeleton width="70%" height={22} style={{ marginBottom:8 }} />
      {Array.from({ length:rows }).map((_, i) => (
        <Skeleton
          key={i}
          width={ROW_WIDTHS[i % ROW_WIDTHS.length]}
          height={12}
          style={{ marginBottom:6 }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
