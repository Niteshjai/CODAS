import { EmptyState } from './EmptyState'
import React from 'react'

export function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={We couldn't find anything matching "".}
      action={
        <button
          onClick={onClear}
          style={{
            padding:'8px 16px', borderRadius:8,
            background:'transparent', color:'var(--text-secondary)',
            border:'1px solid var(--border)', fontSize:13,
            cursor:'pointer'
          }}
        >
          Clear search
        </button>
      }
    />
  )
}
