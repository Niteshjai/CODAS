import { useToastStore, type Toast as ToastType } from '../../store/toastStore'
import React from 'react'

const TOAST_CONFIG = {
  success: { bg:'#EAF3DE', border:'#97C459', text:'#3B6D11', icon:'✓' },
  error:   { bg:'#FCEBEB', border:'#F09595', text:'#A32D2D', icon:'✗' },
  warning: { bg:'#FAEEDA', border:'#FAC775', text:'#854F0B', icon:'⚠' },
  info:    { bg:'#E6F1FB', border:'#85B7EB', text:'#185FA5', icon:'ℹ' },
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position:      'fixed',
        bottom:        24,
        right:         24,
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
        maxWidth:      360,
        width:         'calc(100vw - 48px)',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={remove} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast:     ToastType
  onDismiss: (id:string) => void
}) {
  const cfg = TOAST_CONFIG[toast.type]

  return (
    <div
      role="alert"
      aria-atomic="true"
      style={{
        background:   cfg.bg,
        border:       `0.5px solid ${cfg.border}`,
        borderLeft:   `3px solid ${cfg.border}`,
        borderRadius: '0 8px 8px 0',
        padding:      '12px 14px',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          10,
        animation:    'slideInRight 200ms ease',
        boxShadow:    '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0 }
          to   { transform: translateX(0);    opacity: 1 }
        }
      `}</style>

      {/* Icon */}
      <span style={{
        fontSize:14, fontWeight:700,
        color:cfg.text, flexShrink:0, marginTop:1
      }}>
        {cfg.icon}
      </span>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:500, fontSize:13.5,
                     color:cfg.text, marginBottom:toast.message ? 2 : 0 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize:12.5, color:cfg.text,
                       opacity:0.8, lineHeight:1.5 }}>
            {toast.message}
          </div>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            style={{
              marginTop:6, background:'none',
              border:'none', padding:0,
              color:cfg.text, fontSize:12.5,
              fontWeight:500, cursor:'pointer',
              textDecoration:'underline'
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background:'none', border:'none',
          cursor:'pointer', color:cfg.text,
          fontSize:16, opacity:0.6, flexShrink:0,
          padding:'0 2px', lineHeight:1
        }}
      >
        ×
      </button>
    </div>
  )
}
