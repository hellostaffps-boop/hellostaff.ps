-- ============================================================
-- Hello Staff Pro — Phase 4 Schema (News Social Features)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. NEWS LIKES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Anyone can view likes" 
ON public.news_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like articles" 
ON public.news_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.news_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 2. NEWS COMMENTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK(char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Anyone can view comments" 
ON public.news_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" 
ON public.news_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.news_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.news_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create a view or RPC for fetching comments with user details (Profiles)
CREATE OR REPLACE FUNCTION get_news_comments_with_profiles(p_article_id UUID)
RETURNS TABLE (
  comment_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as comment_id,
    c.content,
    c.created_at,
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.role
  FROM public.news_comments c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.article_id = p_article_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
