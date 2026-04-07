import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface BookNowButtonProps {
  businessId: string;
  serviceId?: string | null;
  staffId?: string | null;
  label?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  onClick?: () => void;
}

export const BookNowButton = ({
  businessId, serviceId, staffId, label,
  className = '', size = 'default', variant = 'default', onClick,
}: BookNowButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accountType, businessId: ownerBusinessId } = useAccountType();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useTranslation();

  const displayLabel = label || t('booking', 'bookNow');

  const buildBookingUrl = () => {
    const params = new URLSearchParams();
    if (serviceId) params.set('service', serviceId);
    if (staffId) params.set('staff', staffId);
    const query = params.toString();
    return `/business/${businessId}${query ? `?${query}` : ''}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (accountType === 'business' && ownerBusinessId === businessId) {
      toast.error("You can't book your own business");
      return;
    }
    if (!user || accountType === 'guest') { setShowAuthModal(true); return; }
    if (onClick) { onClick(); return; }
    navigate(buildBookingUrl());
  };

  return (
    <>
      <Button
        size={size} variant={variant}
        className={cn(variant === 'default' && 'bg-gradient-primary hover:opacity-90 transition-opacity', className)}
        onClick={handleClick}
      >
        {displayLabel}
      </Button>
      <AuthPromptModal open={showAuthModal} onOpenChange={setShowAuthModal}
        message="Create a free account to book this appointment" redirectTo={buildBookingUrl()} />
    </>
  );
};
