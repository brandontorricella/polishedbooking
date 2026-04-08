import polishedLogo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LogoSpinner({ size = 'md', text, className }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <img
        src={polishedLogo}
        alt="Loading"
        className={cn(sizeClasses[size], 'object-contain animate-pulse')}
      />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}
