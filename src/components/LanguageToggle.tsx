import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'navbar' | 'footer';
}

export const LanguageToggle = ({ variant = 'navbar' }: LanguageToggleProps) => {
  const { language, toggleLanguage, setLanguage } = useLanguage();

  if (variant === 'navbar') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="rounded-full border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 gap-2 text-sm font-bold px-4 h-9 transition-all"
        title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
      >
        <Globe className="w-4 h-4 text-cream" />
        <span className="text-cream font-semibold">
          {language === 'en' ? 'Español' : 'English'}
        </span>
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
          English
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
          Español
        </button>
      </div>
    </div>
  );
};
