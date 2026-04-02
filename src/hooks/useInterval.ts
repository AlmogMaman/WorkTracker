import { useEffect, useRef } from 'react'

/** Calls `callback` every `delay` milliseconds. Stops when `delay` is null. */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCb = useRef(callback)

  useEffect(() => {
    savedCb.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCb.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
