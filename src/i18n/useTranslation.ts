import { useAppStore } from '../store/useAppStore'
import { translations } from './translations'

export function useTranslation() {
  const language = useAppStore((s) => s.data.settings.language ?? 'en')
  return translations[language] ?? translations.en
}
