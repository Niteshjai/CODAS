import { useState, useCallback, useRef, useEffect } from 'react'
import { AppError } from '../errors/AppError'
import { errorLogger } from '../errors/errorLogger'

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

interface AsyncState<T> {
  status:    AsyncStatus
  data:      T | null
  error:     AppError | null
  isLoading: boolean
  isSuccess: boolean
  isError:   boolean
  isIdle:    boolean
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute:   (...args: any[]) => Promise<T | null>
  reset:     () => void
  setData:   (data: T) => void
}

export function useAsync<T>(
  asyncFn:  (...args: any[]) => Promise<T>,
  options?: {
    immediate?:  boolean       // run on mount
    onSuccess?:  (data: T) => void
    onError?:    (err: AppError) => void
    context?:    string
  }
): UseAsyncReturn<T> {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const immediate = options?.immediate ?? false

  const [state, setState] = useState<AsyncState<T>>({
    status:    'idle',
    data:      null,
    error:     null,
    isLoading: false,
    isSuccess: false,
    isError:   false,
    isIdle:    true,
  })

  // Prevent state updates on unmounted components
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(async (...args: any[]) => {
    if (!mountedRef.current) return null

    setState({
      status:    'loading',
      data:      null,
      error:     null,
      isLoading: true,
      isSuccess: false,
      isError:   false,
      isIdle:    false,
    })

    try {
      const result = await asyncFn(...args)

      if (!mountedRef.current) return result

      setState({
        status:    'success',
        data:      result,
        error:     null,
        isLoading: false,
        isSuccess: true,
        isError:   false,
        isIdle:    false,
      })

      optionsRef.current?.onSuccess?.(result)
      return result

    } catch (err) {
      if (!mountedRef.current) return null

      const appError = err instanceof AppError
        ? err
        : AppError.unknown(err)

      errorLogger.log({
        error:   appError,
        context: optionsRef.current?.context ?? 'useAsync',
      })

      setState({
        status:    'error',
        data:      null,
        error:     appError,
        isLoading: false,
        isSuccess: false,
        isError:   true,
        isIdle:    false,
      })

      optionsRef.current?.onError?.(appError)
      return null
    }
  }, [asyncFn])

  const reset = useCallback(() => {
    setState({
      status:    'idle',
      data:      null,
      error:     null,
      isLoading: false,
      isSuccess: false,
      isError:   false,
      isIdle:    true,
    })
  }, [])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, status:'success', isSuccess:true }))
  }, [])

  // Run immediately if requested
  useEffect(() => {
    if (immediate) void execute()
  }, [execute, immediate])

  return { ...state, execute, reset, setData }
}
