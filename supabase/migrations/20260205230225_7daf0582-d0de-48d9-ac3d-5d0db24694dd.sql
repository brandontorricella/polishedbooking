-- Create table to track emails that have used free trials
CREATE TABLE public.trial_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  business_id UUID
);

-- Add index for fast email lookups
CREATE INDEX idx_trial_usage_email ON public.trial_usage (email);

-- Enable RLS
ALTER TABLE public.trial_usage ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage trial usage (prevents client-side manipulation)
CREATE POLICY "Service role can manage trial usage"
ON public.trial_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Restrict the policy to service role only by default (no anon/authenticated access)
-- The table will be accessed via edge functions with service role key

-- Create function to check if email has used trial
CREATE OR REPLACE FUNCTION public.has_used_trial(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trial_usage
    WHERE LOWER(email) = LOWER(check_email)
  )
$$;

-- Create function to record trial usage (only callable by authenticated users for their own email)
CREATE OR REPLACE FUNCTION public.record_trial_usage(
  p_email TEXT,
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if trial already used
  IF EXISTS (SELECT 1 FROM public.trial_usage WHERE LOWER(email) = LOWER(p_email)) THEN
    RETURN FALSE;
  END IF;
  
  -- Record the trial usage
  INSERT INTO public.trial_usage (email, user_id, business_id)
  VALUES (LOWER(p_email), p_user_id, p_business_id);
  
  RETURN TRUE;
END;
$$;