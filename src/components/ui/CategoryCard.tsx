import { motion } from 'framer-motion';
import { 
  Scissors, 
  Palette, 
  Sparkles, 
  Hand, 
  Eye, 
  Brush, 
  Droplets, 
  Flower2, 
  Heart, 
  Sun, 
  PenTool, 
  Crown,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Scissors,
  Palette,
  Sparkles,
  Hand,
  Eye,
  Brush,
  Droplets,
  Flower2,
  Heart,
  Sun,
  PenTool,
  Crown,
};

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

export const CategoryCard = ({ 
  id, 
  name, 
  icon, 
  isSelected, 
  onClick,
  variant = 'default'
}: CategoryCardProps) => {
  const IconComponent = iconMap[icon] || Sparkles;

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
          isSelected 
            ? "bg-primary text-primary-foreground shadow-glow" 
            : "bg-card border border-border hover:border-primary/50 hover:shadow-soft"
        )}
      >
        <IconComponent className="w-6 h-6" />
        <span className="text-xs font-medium text-center leading-tight">{name}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-5 rounded-2xl w-full text-left transition-all",
        isSelected 
          ? "bg-gradient-primary text-primary-foreground shadow-elevated" 
          : "bg-card border border-border hover:border-primary/50 hover:shadow-soft"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        isSelected ? "bg-primary-foreground/20" : "bg-secondary"
      )}>
        <IconComponent className={cn("w-6 h-6", !isSelected && "text-primary")} />
      </div>
      <span className="font-medium">{name}</span>
    </motion.button>
  );
};
