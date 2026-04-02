import { useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { WorkBlockRow } from './WorkBlockRow'

interface Props {
  date: string
}

export function WorkBlockList({ date }: Props) {
  const rawBlocks = useAppStore((s) => s.data.days[date])
  const blocks = [...(rawBlocks ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const addBlock = useAppStore((s) => s.addBlock)
  const addToast = useAppStore((s) => s.addToast)
  const getOverlappingIds = useAppStore((s) => s.getOverlappingIds)

  const overlapping = getOverlappingIds(date)

  // Track the id of the most-recently added block so we can auto-focus it
  const justAddedId = useRef<string | null>(null)

  const handleAddBlock = () => {
    const stoppedProject = addBlock(date)
    if (stoppedProject) {
      addToast(`Stopped "${stoppedProject}" — new block started`, 'info')
    }
    // Mark that the next last-block should be auto-focused
    justAddedId.current = 'pending'
  }

  // Resolve 'pending' → the actual id of the newly appended block
  if (justAddedId.current === 'pending' && blocks.length > 0) {
    justAddedId.current = blocks[blocks.length - 1].id
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <span className="text-5xl">⏱</span>
          <p className="text-base font-medium">No time blocks yet</p>
          <p className="text-sm">Click "+ Add Block" to start tracking</p>
        </div>
      ) : (
        blocks.map((block) => {
          const isAutoFocus = justAddedId.current === block.id
          // Clear after first render so it doesn't keep re-focusing
          if (isAutoFocus) justAddedId.current = null
          return (
            <WorkBlockRow
              key={block.id}
              block={block}
              date={date}
              isOverlapping={overlapping.has(block.id)}
              autoFocus={isAutoFocus}
            />
          )
        })
      )}

      <button
        onClick={handleAddBlock}
        className="
          mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
          border-2 border-dashed border-gray-200 dark:border-gray-700
          text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400
          hover:border-blue-300 dark:hover:border-blue-700
          text-sm font-medium transition-colors
        "
        title="Add block (N)"
      >
        <span className="text-lg leading-none">+</span>
        Add Block
      </button>
    </div>
  )
}
