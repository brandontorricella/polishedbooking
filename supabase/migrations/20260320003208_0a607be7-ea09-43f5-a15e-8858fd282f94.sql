
-- Gallery posts
CREATE TABLE public.gallery_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_members(id),
  service_id UUID REFERENCES public.services(id),
  title TEXT,
  description TEXT,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gallery likes
CREATE TABLE public.gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.gallery_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

-- Gallery posts: anyone can view published posts of published businesses
CREATE POLICY "Anyone can view published gallery posts"
ON public.gallery_posts FOR SELECT TO public
USING (is_published = true AND EXISTS (SELECT 1 FROM businesses WHERE businesses.id = gallery_posts.business_id AND businesses.is_published = true));

-- Gallery posts: business owners can manage
CREATE POLICY "Business owners can manage gallery posts"
ON public.gallery_posts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = gallery_posts.business_id AND businesses.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = gallery_posts.business_id AND businesses.owner_id = auth.uid()));

-- Gallery likes: authenticated users can manage their likes
CREATE POLICY "Users can view likes"
ON public.gallery_likes FOR SELECT TO public
USING (true);

CREATE POLICY "Users can add likes"
ON public.gallery_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove likes"
ON public.gallery_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_gallery_business ON public.gallery_posts(business_id, is_published);
CREATE INDEX idx_gallery_likes_post ON public.gallery_likes(post_id);

-- Storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'gallery');

CREATE POLICY "Business owners can upload gallery images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Business owners can delete gallery images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery');
