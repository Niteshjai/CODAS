import { useToastStore, type Toast as ToastType } from '../../store/toastStore'


// Theme-aware status tones (index.css). Dark tones are translucent, so they're layered
// over the opaque popover colour to keep floating toasts readable over page content.
const tone = (name: string) => ({
  bg:     `linear-gradient(var(--tone-${name}-bg), var(--tone-${name}-bg)), var(--popover)`,
  border: `var(--tone-${name}-border)`,
  text:   `var(--tone-${name}-fg)`,
})

const TOAST_CONFIG = {
  success: { ...tone('success'), icon:'✓' },
  error:   { ...tone('danger'),  icon:'✗' },
  warning: { ...tone('warning'), icon:'⚠' },
  info:    { ...tone('info'),    icon:'ℹ' },
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
        bottom:        32,
        left:          '50%',
        transform:     'translateX(-50%)',
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           12,
        maxWidth:      400,
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
        border:       `1px solid ${cfg.border}`,
        borderRadius: '12px',
        padding:      '12px 16px',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          10,
        animation:    'slideUpToast 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow:    '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        width:        '100%',
        backdropFilter: 'blur(8px)',
      }}
    >
      <style>{`
        @keyframes slideUpToast {
          from { transform: translateY(100%) scale(0.9); opacity: 0 }
          to   { transform: translateY(0) scale(1);      opacity: 1 }
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
