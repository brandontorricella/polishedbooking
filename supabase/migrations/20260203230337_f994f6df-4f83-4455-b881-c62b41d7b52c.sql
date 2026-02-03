-- Email subscribers table
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{"deals": true, "hours_updates": true, "new_services": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe"
ON public.email_subscribers
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscription"
ON public.email_subscribers
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own subscriptions  
CREATE POLICY "Users can update own subscription"
ON public.email_subscribers
FOR UPDATE
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Track which businesses a subscriber has visited/interacted with
CREATE TABLE public.subscriber_business_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) CHECK (interaction_type IN ('visited', 'booked', 'viewed', 'saved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subscriber_id, business_id)
);

-- Enable RLS
ALTER TABLE public.subscriber_business_interests ENABLE ROW LEVEL SECURITY;

-- Service role can manage interests
CREATE POLICY "Service role can manage interests"
ON public.subscriber_business_interests
FOR ALL
USING (true);

-- Support inquiries table
CREATE TABLE public.support_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can create support inquiries
CREATE POLICY "Anyone can create support inquiry"
ON public.support_inquiries
FOR INSERT
WITH CHECK (true);

-- Add index for faster email lookups
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX idx_email_subscribers_active ON public.email_subscribers(is_active) WHERE is_active = true;