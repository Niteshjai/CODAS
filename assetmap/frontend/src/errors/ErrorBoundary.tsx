import React, { Component, type ReactNode } from 'react'
import { errorLogger }                  from './errorLogger'
import { AppError }                     from './AppError'

interface Props {
  children:  ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  context?:  string
}

interface State {
  hasError: boolean
  error:    Error | null
  errorId:  string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError:false, error:null, errorId:null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId:  `err-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    errorLogger.log({
      error,
      context: this.props.context ?? 'ErrorBoundary',
      extra: {
        componentStack: info.componentStack,
        errorId:        this.state.errorId,
      },
    })
  }

  reset = (): void => {
    this.setState({ hasError:false, error:null, errorId:null })
  }

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset)
    }

    return (
      <DefaultErrorFallback
        error={this.state.error}
        errorId={this.state.errorId!}
        onReset={this.reset}
      />
    )
  }
}

function DefaultErrorFallback({
  error, errorId, onReset
}: {
  error:   Error
  errorId: string
  onReset: () => void
}) {
  const isKnown = error instanceof AppError

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '48px 24px',
      textAlign:      'center',
      minHeight:      300,
    }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>

      <h2 style={{ fontSize:20, fontWeight:500,
                  color:'var(--text-primary)', marginBottom:8 }}>
        {isKnown ? (error as AppError).userMessage : 'Something went wrong'}
      </h2>

      <p style={{ fontSize:14, color:'var(--text-secondary)',
                 lineHeight:1.6, maxWidth:400, marginBottom:24 }}>
        {isKnown && (error as AppError).category === 'network'
          ? 'Check your internet connection and try again.'
          : 'An unexpected error occurred. This has been reported to our team.'
        }
      </p>

      <div style={{ display:'flex', gap:10 }}>
        <button
          onClick={onReset}
          style={{
            padding:'10px 20px', borderRadius:8,
            background:'#185FA5', color:'white',
            border:'none', fontWeight:500,
            fontSize:14, cursor:'pointer'
          }}
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding:'10px 20px', borderRadius:8,
            border:'0.5px solid var(--border)',
            background:'transparent',
            color:'var(--text-secondary)',
            fontSize:14, cursor:'pointer'
          }}
        >
          Reload page
        </button>
      </div>

      {import.meta.env.DEV && (
        <details style={{ marginTop:24, textAlign:'left',
                         fontSize:11, color:'var(--text-muted)' }}>
          <summary style={{ cursor:'pointer' }}>Error details (dev)</summary>
          <pre style={{ marginTop:8, padding:8,
                       background:'var(--surface-1)',
                       borderRadius:6, overflow:'auto',
                       maxWidth:600 }}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <div style={{ marginTop:16, fontSize:11.5,
                   color:'var(--text-muted)' }}>
        Error ID: {errorId}
      </div>
    </div>
  )
}
