import { EmptyState } from './EmptyState'
import React from 'react'

export function EmptyAssets({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="📂"
      title="No assets found"
      description="You haven't added any assets yet. Connect your accounts or add them manually to start tracking your net worth."
      action={
        <button
          onClick={onAdd}
          style={{
            padding:'10px 20px', borderRadius:20,
            background:'#185FA5', color:'white',
            border:'none', fontWeight:500, fontSize:14,
            cursor:'pointer'
          }}
        >
          Add your first asset
        </button>
      }
    />
  )
}
