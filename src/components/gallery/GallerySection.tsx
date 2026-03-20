import { useState } from 'react';
import { useGalleryPosts } from '@/hooks/useGallery';
import { GalleryCard } from './GalleryCard';
import { GalleryModal } from './GalleryModal';
import type { GalleryPost } from '@/hooks/useGallery';
import { Loader2, Image } from 'lucide-react';

interface GallerySectionProps {
  businessId: string;
}

export function GallerySection({ businessId }: GallerySectionProps) {
  const { posts, loading, refetch } = useGalleryPosts(businessId);
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          Before & After
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {posts.slice(0, 6).map(post => (
          <GalleryCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
        ))}
      </div>

      {selectedPost && (
        <GalleryModal
          post={selectedPost}
          onClose={() => { setSelectedPost(null); refetch(); }}
        />
      )}
    </section>
  );
}
