-- ============================================================
-- Hello Staff Pro — Platform Testimonials Schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_testimonials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view featured testimonials" 
ON public.platform_testimonials FOR SELECT 
USING (is_featured = true);

CREATE POLICY "Platform admins can manage testimonials"
ON public.platform_testimonials FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));
