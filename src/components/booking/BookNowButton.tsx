import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  businessId,
  serviceId,
  staffId,
  label = 'Book Now',
  className = '',
  size = 'default',
  variant = 'default',
  onClick,
}: BookNowButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accountType, businessId: ownerBusinessId } = useAccountType();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const buildBookingUrl = () => {
    const params = new URLSearchParams();
    if (serviceId) params.set('service', serviceId);
    if (staffId) params.set('staff', staffId);
    const query = params.toString();
    return `/business/${businessId}${query ? `?${query}` : ''}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Block business owners from booking their own business
    if (accountType === 'business' && ownerBusinessId === businessId) {
      toast.error("You can't book your own business");
      return;
    }

    // Block guests — show auth modal
    if (!user || accountType === 'guest') {
      setShowAuthModal(true);
      return;
    }

    // If a custom onClick is provided (e.g. open BookingFlow dialog), use it
    if (onClick) {
      onClick();
      return;
    }

    // Navigate to business profile (booking flow is a dialog there)
    navigate(buildBookingUrl());
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={cn(
          variant === 'default' && 'bg-gradient-primary hover:opacity-90 transition-opacity',
          className
        )}
        onClick={handleClick}
      >
        {label}
      </Button>

      <AuthPromptModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message="Create a free account to book this appointment"
        redirectTo={buildBookingUrl()}
      />
    </>
  );
};
