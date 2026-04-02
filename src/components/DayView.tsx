import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { DateNavigator } from './DateNavigator'
import { DailySummaryPanel } from './DailySummaryPanel'
import { NewProjectInput } from './NewProjectInput'
import { ProgressBar } from './ProgressBar'
import { ProjectCard } from './ProjectCard'

export function DayView() {
  const t = useTranslation()
  const selectedDate = useAppStore((s) => s.selectedDate)

  // Get raw blocks reference — stable (undefined or same array ref)
  const rawBlocks = useAppStore((s) => s.data.days[selectedDate])
  // Derive project names outside the selector (no new array inside selector)
  const projectNames: string[] = []
  if (rawBlocks) {
    const seen = new Set<string>()
    for (const b of rawBlocks) {
      const key = b.project.trim() || '(no project)'
      if (!seen.has(key)) { seen.add(key); projectNames.push(key) }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2 pb-24 sm:pb-8 flex flex-col gap-4">
      <DateNavigator />
      <ProgressBar date={selectedDate} />

      {/* Project cards — scrollable list */}
      <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-3 pr-1">
        {projectNames.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <span className="text-5xl">⏱</span>
            <p className="text-base font-medium">{t.day.noProjects}</p>
            <p className="text-sm">{t.day.tapToStart}</p>
          </div>
        )}

        {projectNames.map((project) => (
          <ProjectCard key={project} project={project} date={selectedDate} />
        ))}
      </div>

      {/* Add new project */}
      <NewProjectInput
        date={selectedDate}
        existingProjects={projectNames}
        onStarted={() => {}}
      />

      <DailySummaryPanel date={selectedDate} />
    </div>
  )
}
