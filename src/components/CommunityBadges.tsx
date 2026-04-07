import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface CommunityBadgesProps {
  business: {
    isBlackOwned?: boolean;
    isHispanicOwned?: boolean;
    isLgbtqOwned?: boolean;
    isLgbtqWelcoming?: boolean;
  };
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export const CommunityBadges = ({ business, size = 'normal', className }: CommunityBadgesProps) => {
  const { t } = useTranslation();

  const badges: { key: string; label: string; emoji: string; className: string }[] = [];

  if (business.isBlackOwned) {
    badges.push({
      key: 'black_owned',
      label: t('badges', 'blackOwned'),
      emoji: '✊🏿',
      className: 'bg-midnight/90 text-cream border-0',
    });
  }

  if (business.isHispanicOwned) {
    badges.push({
      key: 'hispanic_owned',
      label: t('badges', 'hispanicOwned'),
      emoji: '🤎',
      className: 'bg-[hsl(15,60%,25%)]/90 text-orange-100 border-0',
    });
  }

  if (business.isLgbtqOwned) {
    badges.push({
      key: 'lgbtq_owned',
      label: t('badges', 'lgbtqOwned'),
      emoji: '🏳️‍🌈',
      className: 'bg-[hsl(270,50%,30%)]/90 text-purple-100 border-0',
    });
  } else if (business.isLgbtqWelcoming) {
    badges.push({
      key: 'lgbtq_welcoming',
      label: t('badges', 'lgbtqWelcoming'),
      emoji: '🏳️‍🌈',
      className: 'bg-[hsl(270,40%,35%)]/70 text-purple-100 border-0',
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map(badge => (
        <Badge
          key={badge.key}
          className={cn(
            badge.className,
            size === 'small' && 'text-[10px] px-2 py-0.5',
            size === 'normal' && 'text-xs px-2.5 py-0.5',
            size === 'large' && 'text-sm px-3 py-1'
          )}
        >
          {badge.emoji} {badge.label}
        </Badge>
      ))}
    </div>
  );
};
