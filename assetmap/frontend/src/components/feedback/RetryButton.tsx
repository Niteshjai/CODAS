import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isRetrying:  boolean
  countdown?:  number
  label?:      string
}

export function RetryButton({
  isRetrying,
  countdown = 0,
  label     = 'Try again',
  style,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={isRetrying || countdown > 0 || props.disabled}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           8,
        opacity:       (isRetrying || countdown > 0) ? 0.7 : 1,
        cursor:        (isRetrying || countdown > 0) ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {isRetrying && (
        <span style={{ fontSize:12, animation:'spin 1s linear infinite' }}>↻</span>
      )}
      {countdown > 0 ? Retrying in s : (isRetrying ? 'Retrying...' : label)}
    </button>
  )
}
