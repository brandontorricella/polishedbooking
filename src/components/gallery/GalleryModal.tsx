import { useState, useRef, useCallback } from 'react';
import { X, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGalleryLike, type GalleryPost } from '@/hooks/useGallery';
import { useNavigate } from 'react-router-dom';

interface GalleryModalProps {
  post: GalleryPost;
  onClose: () => void;
}

export function GalleryModal({ post, onClose }: GalleryModalProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { toggleLike } = useGalleryLike();
  const navigate = useNavigate();

  const handleMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  const handleLike = async () => {
    const newLiked = await toggleLike(post.id, liked);
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <div className="flex justify-end p-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comparison Slider */}
        <div
          ref={sliderRef}
          className="relative aspect-[4/3] overflow-hidden cursor-ew-resize select-none"
          onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
          onMouseDown={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
          {/* After (full) */}
          <div className="absolute inset-0">
            <img src={post.after_image_url} alt="After" className="w-full h-full object-cover" />
            <Badge className="absolute top-4 right-4" variant="secondary">After</Badge>
          </div>
          {/* Before (clipped) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
            <img src={post.before_image_url} alt="Before" className="w-full h-full object-cover" />
            <Badge className="absolute top-4 left-4" variant="secondary">Before</Badge>
          </div>
          {/* Handle */}
          <div className="absolute top-0 bottom-0" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
            <div className="absolute inset-0 w-0.5 bg-white mx-auto" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-foreground font-bold text-sm">
              ↔
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          {post.title && <h2 className="text-xl font-bold">{post.title}</h2>}
          {post.description && <p className="text-muted-foreground">{post.description}</p>}

          <div className="flex flex-wrap gap-2">
            {post.service_name && <Badge variant="secondary">{post.service_name}</Badge>}
            {post.staff_name && <Badge variant="outline">By {post.staff_name}</Badge>}
          </div>

          <div className="flex gap-3">
            <Button
              variant={liked ? 'default' : 'outline'}
              onClick={handleLike}
              className={liked ? 'bg-primary text-primary-foreground' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              onClick={() => {
                onClose();
                navigate(`/business/${post.business_id}`);
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book This Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
