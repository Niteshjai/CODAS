
interface Props {
  size?:  number
  color?: string
}

export function Spinner({ size = 20, color = '#84cc16' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        animation: 'spin 0.75s linear infinite',
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) {
          svg { animation: none !important }
        }
      `}</style>
      <circle
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
