import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { useClickOutside } from '../hooks/useClickOutside'

interface Props {
  date: string
  existingProjects: string[]
  onStarted: () => void
}

export function NewProjectInput({ date, existingProjects, onStarted }: Props) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const projectOrder = useAppStore((s) => s.data.projectOrder ?? [])
  const addBlock = useAppStore((s) => s.addBlock)
  const addToast = useAppStore((s) => s.addToast)
  const removeProjectFromSuggestions = useAppStore((s) => s.removeProjectFromSuggestions)

  const allProjects = projectOrder.filter((p) => !existingProjects.includes(p))
  const filtered = value.trim()
    ? allProjects.filter((p) => p.toLowerCase().includes(value.toLowerCase()))
    : allProjects

  useClickOutside(containerRef, () => {
    setOpen(false)
    setValue('')
  })

  const start = (projectName: string) => {
    const name = projectName.trim()
    if (!name) return
    addBlock(date, name)
    addToast(t.newProject.started(name), 'success')
    setValue('')
    setOpen(false)
    onStarted()
  }

  const handleRemove = (e: React.MouseEvent, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    removeProjectFromSuggestions(name)
    addToast(t.newProject.removed(name), 'info')
    setHighlighted(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        start(filtered[highlighted])
      } else if (value.trim()) {
        start(value.trim())
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setValue('')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        data-new-project
        className="
          flex items-center justify-center gap-2 w-full py-3 rounded-2xl
          border-2 border-dashed border-gray-200 dark:border-gray-700
          text-gray-400 dark:text-gray-500
          hover:text-blue-600 dark:hover:text-blue-400
          hover:border-blue-300 dark:hover:border-blue-700
          text-sm font-semibold transition-colors
        "
      >
        <span className="text-lg leading-none">+</span>
        {t.day.newProject}
      </button>
    )
  }

  const showNewOption = value.trim() && !projectOrder.includes(value.trim())

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-gray-800 shadow-md">
        <span className="text-gray-400 dark:text-gray-500 text-base shrink-0">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={t.newProject.placeholder}
          onChange={(e) => { setValue(e.target.value); setHighlighted(-1) }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          autoFocus
        />
        {value && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setValue(''); setHighlighted(-1); inputRef.current?.focus() }}
            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm leading-none"
          >
            ✕
          </button>
        )}
        <button
          onMouseDown={(e) => { e.preventDefault(); setOpen(false); setValue('') }}
          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-lg leading-none pl-1 border-l border-gray-100 dark:border-gray-700 ml-1"
        >
          ✕
        </button>
      </div>

      {/* Dropdown list */}
      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
        {/* Scrollable list */}
        <div className="overflow-y-auto max-h-56">
          {filtered.length === 0 && !showNewOption ? (
            <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              {value.trim() ? t.newProject.noMatching : t.newProject.noSaved}
            </p>
          ) : (
            filtered.map((name, i) => (
              <div
                key={name}
                onMouseDown={(e) => { e.preventDefault(); start(name) }}
                className={`
                  flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors group
                  ${i === highlighted
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className={`text-xs shrink-0 ${i === highlighted ? 'text-blue-200' : 'text-green-500'}`}>▶</span>
                <span className="flex-1 text-sm font-medium truncate">{name}</span>
                {/* Remove button */}
                <button
                  onMouseDown={(e) => handleRemove(e, name)}
                  className={`
                    shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs
                    opacity-0 group-hover:opacity-100 transition-opacity
                    ${i === highlighted
                      ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                      : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }
                  `}
                  title={t.newProject.removeTitle}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* "Start new" option pinned at bottom */}
        {showNewOption && (
          <div
            onMouseDown={(e) => { e.preventDefault(); start(value.trim()) }}
            className="px-4 py-2.5 text-sm font-medium cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
          >
            <span>+</span>
            <span>{t.newProject.startNew(value.trim())}</span>
          </div>
        )}
      </div>
    </div>
  )
}
