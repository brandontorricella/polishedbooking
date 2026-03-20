import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface GalleryPost {
  id: string;
  business_id: string;
  staff_id: string | null;
  service_id: string | null;
  title: string | null;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  is_featured: boolean;
  is_published: boolean;
  likes_count: number;
  views_count: number;
  created_at: string;
  service_name?: string;
  staff_name?: string;
  is_liked?: boolean;
}

export function useGalleryPosts(businessId: string) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_posts')
      .select('*, services(name), staff_members(name)')
      .eq('business_id', businessId)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    let enriched = (data || []).map((p: any) => ({
      ...p,
      service_name: p.services?.name || null,
      staff_name: p.staff_members?.name || null,
      is_liked: false,
    }));

    if (user && enriched.length > 0) {
      const { data: likes } = await supabase
        .from('gallery_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', enriched.map(p => p.id));
      const likedIds = new Set((likes || []).map(l => l.post_id));
      enriched = enriched.map(p => ({ ...p, is_liked: likedIds.has(p.id) }));
    }

    setPosts(enriched);
    setLoading(false);
  }, [businessId, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}

export function useGalleryManagement(businessId: string) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery_posts')
      .select('*, services(name), staff_members(name)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    setPosts((data || []).map((p: any) => ({
      ...p,
      service_name: p.services?.name || null,
      staff_name: p.staff_members?.name || null,
    })));
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async (post: {
    title: string;
    description: string;
    before_image_url: string;
    after_image_url: string;
    service_id: string | null;
    staff_id: string | null;
  }) => {
    const { error } = await supabase.from('gallery_posts').insert({
      business_id: businessId,
      ...post,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return false; }
    toast({ title: 'Post added!' });
    await fetchPosts();
    return true;
  };

  const updatePost = async (id: string, updates: Partial<GalleryPost>) => {
    const { error } = await supabase.from('gallery_posts').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchPosts();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('gallery_posts').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Post deleted' });
    await fetchPosts();
  };

  const uploadImage = async (file: File, type: 'before' | 'after'): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${businessId}/${Date.now()}-${type}.${ext}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return null; }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path);
    return data.publicUrl;
  };

  return { posts, loading, createPost, updatePost, deletePost, uploadImage, refetch: fetchPosts };
}

export function useGalleryLike() {
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleLike = async (postId: string, isLiked: boolean): Promise<boolean> => {
    if (!user) { toast({ title: 'Sign in required', description: 'Please sign in to like posts.', variant: 'destructive' }); return isLiked; }

    if (isLiked) {
      await supabase.from('gallery_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.from('gallery_posts').update({ likes_count: Math.max(0, -1) }).eq('id', postId);
      // Decrement via rpc would be better, but let's use a simple approach
      const { data } = await supabase.from('gallery_posts').select('likes_count').eq('id', postId).single();
      if (data) {
        await supabase.from('gallery_posts').update({ likes_count: Math.max(0, (data.likes_count || 1) - 1) }).eq('id', postId);
      }
      return false;
    } else {
      const { error } = await supabase.from('gallery_likes').insert({ post_id: postId, user_id: user.id });
      if (error && error.code === '23505') return true; // Already liked
      if (error) return false;
      const { data } = await supabase.from('gallery_posts').select('likes_count').eq('id', postId).single();
      if (data) {
        await supabase.from('gallery_posts').update({ likes_count: (data.likes_count || 0) + 1 }).eq('id', postId);
      }
      return true;
    }
  };

  return { toggleLike };
}
