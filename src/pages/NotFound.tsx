import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from '@/hooks/useTranslation';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('notFound', 'title')}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t('notFound', 'goHome')}
        </a>
        <p className="mt-5 text-sm text-muted-foreground">
          {t('notFound', 'needHelp')}{' '}
          <a href="mailto:support@polishedbooking.com?subject=Help — page not found on Polished" className="text-primary no-underline hover:underline">
            support@polishedbooking.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
