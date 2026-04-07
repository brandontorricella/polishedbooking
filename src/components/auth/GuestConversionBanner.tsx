import { Link } from 'react-router-dom';
import { useAccountType } from '@/hooks/useAccountType';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GuestConversionBannerProps {
  message?: string;
}

export const GuestConversionBanner = ({
  message,
}: GuestConversionBannerProps) => {
  const { accountType } = useAccountType();
  const { t } = useTranslation();
  if (accountType !== 'guest') return null;

  const displayMessage = message || t('guestBanner', 'createAccount');

  return (
    <div className="bg-gradient-primary text-primary-foreground p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{displayMessage}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Link to="/auth?mode=signup">
          <Button size="sm" className="bg-background text-foreground hover:bg-background/90">
            {t('guestBanner', 'signUpFree')}
          </Button>
        </Link>
        <Link to="/auth?mode=login">
          <Button size="sm" variant="ghost" className="border border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent">
            {t('guestBanner', 'logIn')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
