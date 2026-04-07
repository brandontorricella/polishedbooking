import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('polished_language');
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language?.startsWith('es') ? 'es' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('polished_language', language);
    // Persist to DB if logged in (fire and forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').update({ preferred_language: language }).eq('user_id', user.id);
      }
    });
  }, [language]);

  // Load saved preference on auth change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (data?.preferred_language === 'es' || data?.preferred_language === 'en') {
          setLanguageState(data.preferred_language as Language);
          localStorage.setItem('polished_language', data.preferred_language);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'en' ? 'es' : 'en');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
