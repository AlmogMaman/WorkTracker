import { useEffect, useRef, useState } from 'react'
//import { useClickOutside } from '../hooks/useClickOutside'
import { useAppStore } from '../store/useAppStore'

interface Props {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  autoFocus?: boolean
}

export function ProjectAutocomplete({ value, onChange, onBlur, autoFocus }: Props) {
  const [localValue, setLocalValue] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const getAllProjectNames = useAppStore((s) => s.getAllProjectNames)

  // Sync when parent value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Auto-focus on mount for new blocks
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const allProjects = getAllProjectNames()
  const filtered = localValue.trim()
    ? allProjects.filter((p) => p.toLowerCase().includes(localValue.toLowerCase()))
    : allProjects

  const commit = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      if (e.key === 'Enter') {
        commit(localValue)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, Math.min(filtered.length, 8) - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        commit(filtered[highlighted])
      } else {
        commit(localValue)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Tab') {
      if (highlighted >= 0 && filtered[highlighted]) {
        e.preventDefault()
        commit(filtered[highlighted])
      } else {
        commit(localValue)
        setOpen(false)
      }
    }
  }

  // Close + save on blur (with delay so mousedown on suggestion fires first)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      commit(localValue)
      setOpen(false)
      onBlur()
    }, 150)
  }
  const cancelBlur = () => clearTimeout(blurTimerRef.current)

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        placeholder="Project name…"
        className="
          w-full px-2.5 py-1.5 text-sm rounded-md border border-transparent
          bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700
          text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
          transition-colors
        "
        onFocus={() => { setOpen(true); setHighlighted(-1) }}
        onChange={(e) => {
          setLocalValue(e.target.value)
          setOpen(true)
          setHighlighted(-1)
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {filtered.slice(0, 8).map((name, i) => (
            <div
              key={name}
              onMouseDown={(e) => {
                e.preventDefault() // prevent input blur
                cancelBlur()
                commit(name)
                setLocalValue(name)
              }}
              className={`
                px-3 py-2 text-sm cursor-pointer transition-colors
                ${
                  i === highlighted
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
