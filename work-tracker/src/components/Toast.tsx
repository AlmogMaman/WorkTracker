import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg cursor-pointer
            text-sm font-medium min-w-[220px] max-w-xs
            transition-all duration-300
            ${t.type === 'success' ? 'bg-green-600 text-white' : ''}
            ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${t.type === 'info' ? 'bg-gray-800 text-white dark:bg-gray-700' : ''}
          `}
        >
          <span className="flex-1">{t.message}</span>
          <button className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  )
}
