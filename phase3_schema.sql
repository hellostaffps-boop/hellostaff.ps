-- ============================================================
-- Hello Staff Pro — Phase 3 SQL: News, Dynamic Ratings
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── NEWS ARTICLES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  excerpt_ar TEXT,
  content TEXT,
  content_ar TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  author_id TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published news" ON public.news_articles FOR SELECT 
  USING (status = 'published');
CREATE POLICY "Admins can manage news" ON public.news_articles
  USING (public.get_user_role() = 'platform_admin');

CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news_articles(published_at DESC);

-- ─── TOP CANDIDATES RPC ────────────────────────────────────
-- Returns candidates ordered by their average rating from employee_reviews
CREATE OR REPLACE FUNCTION public.get_top_rated_candidates(limit_count integer DEFAULT 5)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  title TEXT,
  avatar_url TEXT,
  city TEXT,
  average_rating NUMERIC,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id AS profile_id,
    cp.full_name,
    cp.title,
    cp.avatar_url,
    cp.city,
    COALESCE(ROUND(AVG(er.rating)::numeric, 1), 5.0) AS average_rating,
    COUNT(er.id) AS review_count
  FROM public.candidate_profiles cp
  LEFT JOIN public.employee_reviews er ON cp.user_email = er.candidate_email
  WHERE cp.is_available = true AND cp.full_name IS NOT NULL
  GROUP BY cp.user_id, cp.full_name, cp.title, cp.avatar_url, cp.city
  ORDER BY average_rating DESC, review_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
