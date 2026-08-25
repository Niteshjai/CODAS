import { Skeleton } from './Skeleton'

interface Props { rows?: number }

export function ListSkeleton({ rows = 5 }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading list"
      style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:12, overflow:'hidden'
      }}
    >
      {Array.from({ length:rows }).map((_, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'12px 16px',
          borderBottom:i < rows-1 ? '0.5px solid var(--border, #e4e4e7)' : 'none'
        }}>
          <Skeleton width={40} height={40} radius={8} />
          <div style={{ flex:1 }}>
            <Skeleton width="55%" height={13} style={{ marginBottom:6 }} />
            <Skeleton width="35%" height={11} />
          </div>
          <Skeleton width={70} height={13} />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
