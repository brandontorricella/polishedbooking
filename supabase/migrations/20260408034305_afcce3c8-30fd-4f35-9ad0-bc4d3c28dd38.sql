
-- Intake form templates
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  require_for_new_clients_only BOOLEAN DEFAULT FALSE,
  service_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active intake forms of published businesses"
ON public.intake_forms FOR SELECT USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.businesses WHERE businesses.id = intake_forms.business_id AND businesses.is_published = true
  )
);

CREATE POLICY "Business owners can manage their intake forms"
ON public.intake_forms FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = intake_forms.business_id AND businesses.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = intake_forms.business_id AND businesses.owner_id = auth.uid()));

CREATE INDEX idx_intake_forms_business ON public.intake_forms(business_id, is_active);

-- Intake form questions
CREATE TABLE IF NOT EXISTS public.intake_form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  options TEXT[] DEFAULT '{}'::text[],
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  placeholder TEXT
);

ALTER TABLE public.intake_form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions of active forms"
ON public.intake_form_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.intake_forms f
    JOIN public.businesses b ON b.id = f.business_id
    WHERE f.id = intake_form_questions.form_id AND f.is_active = true AND b.is_published = true
  )
);

CREATE POLICY "Business owners can manage form questions"
ON public.intake_form_questions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.intake_forms f
  JOIN public.businesses b ON b.id = f.business_id
  WHERE f.id = intake_form_questions.form_id AND b.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.intake_forms f
  JOIN public.businesses b ON b.id = f.business_id
  WHERE f.id = intake_form_questions.form_id AND b.owner_id = auth.uid()
));

-- Intake form submissions
CREATE TABLE IF NOT EXISTS public.intake_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(form_id, booking_id)
);

ALTER TABLE public.intake_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view submissions for their business"
ON public.intake_form_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = intake_form_submissions.business_id AND businesses.owner_id = auth.uid()));

CREATE POLICY "Users can create submissions"
ON public.intake_form_submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions"
ON public.intake_form_submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_intake_submissions_user ON public.intake_form_submissions(user_id, business_id);
CREATE INDEX idx_intake_submissions_booking ON public.intake_form_submissions(booking_id);

-- Add trigger for updated_at on intake_forms
CREATE TRIGGER update_intake_forms_updated_at
BEFORE UPDATE ON public.intake_forms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
