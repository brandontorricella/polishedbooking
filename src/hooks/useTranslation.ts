import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useLanguage();

  function t(section: string, key: string): string {
    const lang = translations[language] as any;
    return lang?.[section]?.[key] || (translations.en as any)?.[section]?.[key] || key;
  }

  return { t, language };
}
