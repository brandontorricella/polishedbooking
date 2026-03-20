import { useState } from 'react';
import { Heart } from 'lucide-react';
import type { GalleryPost } from '@/hooks/useGallery';
import { Badge } from '@/components/ui/badge';

interface GalleryCardProps {
  post: GalleryPost;
  onClick: () => void;
}

export function GalleryCard({ post, onClick }: GalleryCardProps) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <div
        className="relative aspect-square overflow-hidden"
        onMouseEnter={() => setShowAfter(true)}
        onMouseLeave={() => setShowAfter(false)}
        onTouchStart={() => setShowAfter(true)}
        onTouchEnd={() => setShowAfter(false)}
      >
        <img
          src={showAfter ? post.after_image_url : post.before_image_url}
          alt={post.title || 'Gallery'}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <Badge
          className="absolute bottom-2 left-2 text-xs"
          variant={showAfter ? 'default' : 'secondary'}
        >
          {showAfter ? 'After' : 'Before'}
        </Badge>
        {post.is_featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            ★ Featured
          </Badge>
        )}
      </div>
      <div className="p-2">
        {post.title && <p className="text-sm font-medium truncate">{post.title}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {post.likes_count}
          </span>
          {post.service_name && <span>{post.service_name}</span>}
        </div>
      </div>
    </div>
  );
}
