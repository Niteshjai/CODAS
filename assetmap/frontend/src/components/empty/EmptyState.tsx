import type { ReactNode } from 'react'

interface Props {
  title:       string
  description: ReactNode
  icon?:       ReactNode
  action?:     ReactNode
  fullHeight?: boolean
}

export function EmptyState({
  title, description, icon, action, fullHeight = false
}: Props) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '48px 24px',
      textAlign:      'center',
      minHeight:      fullHeight ? '60vh' : 240,
      background:     'var(--surface-2, #fafafa)',
      border:         '0.5px dashed var(--border, #e4e4e7)',
      borderRadius:   16,
    }}>
      {icon && (
        <div style={{ fontSize:40, marginBottom:16, opacity:0.8 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:8 }}>
        {title}
      </h3>
      <p style={{ fontSize:14, color:'var(--text-secondary)', maxWidth:400, lineHeight:1.5, marginBottom: action ? 24 : 0 }}>
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
