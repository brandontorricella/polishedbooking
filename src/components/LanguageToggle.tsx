import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  variant?: 'navbar' | 'footer';
}

export const LanguageToggle = ({ variant = 'navbar' }: LanguageToggleProps) => {
  const { language, toggleLanguage, setLanguage } = useLanguage();

  if (variant === 'navbar') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="rounded-lg text-cream/70 hover:text-cream hover:bg-cream/10 gap-1.5 text-sm font-semibold"
        title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
      >
        <span className="text-base">{language === 'en' ? '🇲🇽' : '🇺🇸'}</span>
        <span className="hidden sm:inline">{language === 'en' ? 'ES' : 'EN'}</span>
      </Button>
    );
  }

  // Footer variant
  return (
    <div className="mt-5">
      <span className="text-sm text-cream/50 block mb-2">
        {language === 'en' ? 'Language / Idioma:' : 'Idioma / Language:'}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            language === 'en'
              ? "bg-primary border-primary text-white"
              : "bg-cream/10 border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream"
          )}
        >
          🇺🇸 English
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            language === 'es'
              ? "bg-primary border-primary text-white"
              : "bg-cream/10 border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream"
          )}
        >
          🇲🇽 Español
        </button>
      </div>
    </div>
  );
};
