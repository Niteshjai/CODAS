import { AppError } from '../../errors/AppError'
import { RetryButton } from '../feedback/RetryButton'
import React from 'react'

interface Props {
  error:   Error | AppError
  onRetry?:() => void
  compact?:boolean
}

export function ErrorCard({ error, onRetry, compact = false }: Props) {
  const isKnown = error instanceof AppError

  return (
    <div style={{
      padding:      compact ? 16 : 24,
      background:   '#FCEBEB',
      border:       '0.5px solid #F09595',
      borderRadius: 12,
      display:      'flex',
      flexDirection:compact ? 'row' : 'column',
      alignItems:   compact ? 'center' : 'flex-start',
      gap:          compact ? 16 : 12,
      textAlign:    'left'
    }}>
      <div style={{
        fontSize: compact ? 20 : 28,
        lineHeight: 1
      }}>
        ⚠️
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{
          fontSize:  14,
          fontWeight:600,
          color:     '#A32D2D',
          marginBottom:4
        }}>
          {isKnown ? error.userMessage : 'Something went wrong'}
        </h4>
        {!compact && (
          <p style={{ fontSize:13, color:'#A32D2D', opacity:0.8, lineHeight:1.4 }}>
            {isKnown && error.category === 'network'
              ? 'Check your connection and try again.'
              : 'Our team has been notified. Please try again.'}
          </p>
        )}
      </div>

      {onRetry && (
        <RetryButton
          onClick={onRetry}
          isRetrying={false}
          style={{
            background:'#A32D2D',
            color:'white',
            border:'none',
            padding:'8px 16px',
            borderRadius:6,
            fontSize:13,
            fontWeight:500,
            cursor:'pointer'
          }}
        />
      )}
    </div>
  )
}
