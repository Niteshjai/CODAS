import { Skeleton } from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      style={{ padding:'20px 16px', maxWidth:900, margin:'0 auto' }}
    >
      {/* Net worth hero */}
      <div style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:16, padding:24, marginBottom:16
      }}>
        <Skeleton width={120} height={13} style={{ marginBottom:12 }} />
        <Skeleton width={200} height={38} style={{ marginBottom:8 }} />
        <Skeleton width={160} height={13} />
      </div>

      {/* Asset category cards row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                   gap:10, marginBottom:16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            background:'var(--surface-2, #fafafa)',
            border:'0.5px solid var(--border, #e4e4e7)',
            borderRadius:12, padding:16
          }}>
            <Skeleton width={80} height={12} style={{ marginBottom:10 }} />
            <Skeleton width={100} height={22} style={{ marginBottom:6 }} />
            <Skeleton width={60}  height={11} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:12, padding:'20px', marginBottom:16
      }}>
        <Skeleton width={120} height={13} style={{ marginBottom:16 }} />
        <Skeleton width="100%" height={180} radius={8} />
      </div>

      {/* Asset list */}
      <div style={{
        background:'var(--surface-2, #fafafa)',
        border:'0.5px solid var(--border, #e4e4e7)',
        borderRadius:12, overflow:'hidden'
      }}>
        {[1,2,3,4,5].map((i, idx) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'14px 16px',
            borderBottom:idx < 4 ? '0.5px solid var(--border, #e4e4e7)' : 'none'
          }}>
            <Skeleton width={36} height={36} radius="50%" />
            <div style={{ flex:1 }}>
              <Skeleton width="60%" height={13} style={{ marginBottom:6 }} />
              <Skeleton width="40%" height={11} />
            </div>
            <Skeleton width={80} height={14} />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading your financial dashboard...</span>
    </div>
  )
}
