import { Skeleton } from './Skeleton'
import { ListSkeleton } from './ListSkeleton'

/** Full-page placeholder for single-item pages (asset / portfolio detail): header, hero card, list. */
export function DetailPageSkeleton({ label = 'Loading details' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="page-gradient-bg min-h-screen px-4 py-8 md:px-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} radius="50%" />
          <Skeleton width={180} height={18} />
        </div>
        <div className="skeleton-surface p-6">
          <Skeleton width={56} height={56} radius={16} style={{ marginBottom:16 }} />
          <Skeleton width="35%" height={14} style={{ marginBottom:10 }} />
          <Skeleton width="50%" height={36} style={{ marginBottom:10 }} />
          <Skeleton width="25%" height={12} />
        </div>
        <ListSkeleton rows={4} />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  )
}

/** Full-page wrapper for an initial-load failure on a detail page. */
export function PageLoadError({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-gradient-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[28rem]">{children}</div>
    </div>
  )
}
