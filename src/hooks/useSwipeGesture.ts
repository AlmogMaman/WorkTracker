import { useEffect, useRef } from 'react'

interface Options {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** Minimum horizontal distance in px to trigger a swipe (default 60) */
  threshold?: number
  /** Maximum vertical deviation ratio before swipe is ignored (default 0.6) */
  maxVerticalRatio?: number
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, threshold = 60, maxVerticalRatio = 0.6 }: Options,
) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return
      const dx = e.changedTouches[0].clientX - startX.current
      const dy = e.changedTouches[0].clientY - startY.current
      startX.current = null
      startY.current = null

      if (Math.abs(dx) < threshold) return
      if (Math.abs(dy) / Math.abs(dx) > maxVerticalRatio) return

      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref, onSwipeLeft, onSwipeRight, threshold, maxVerticalRatio])
}
