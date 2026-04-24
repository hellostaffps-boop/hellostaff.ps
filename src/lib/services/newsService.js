/**
 * newsService.js — News articles and social interaction operations.
 */
import { supabase } from "@/lib/supabaseClient";

export const getLatestNews = async (limit = 3) => {
  const { data, error } = await supabase
    .from("news_articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[getLatestNews]", error);
    return [];
  }
  return data || [];
};

export const getNewsArticleById = async (slugOrId) => {
  if (!slugOrId) return null;
  let query = supabase.from("news_articles").select("*").eq("status", "published");
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  query = isUUID ? query.eq("id", slugOrId) : query.eq("slug", slugOrId);
  const { data, error } = await query.single();
  if (error && error.code !== "PGRST116") console.error("[getNewsArticleById]", error);
  return data || null;
};

export const getArticleComments = async (articleId) => {
  if (!articleId) return [];
  const { data, error } = await supabase.rpc("get_news_comments_with_profiles", { p_article_id: articleId });
  if (error) {
    console.error("[getArticleComments]", error);
    return [];
  }
  return data || [];
};

export const addArticleComment = async (articleId, userId, content) => {
  if (!articleId || !userId || !content) return null;
  const { data, error } = await supabase.from("news_comments").insert({
    article_id: articleId,
    user_id: userId,
    content,
  }).select("*").single();
  if (error) {
    console.error("[addArticleComment]", error);
    throw error;
  }
  return data;
};

export const getArticleLikes = async (articleId, userId = null) => {
  if (!articleId) return { count: 0, hasLiked: false };
  const { count, error: countError } = await supabase
    .from("news_likes")
    .select("*", { count: "exact", head: true })
    .eq("article_id", articleId);
  if (countError) console.error("[getArticleLikes count]", countError);

  let hasLiked = false;
  if (userId) {
    const { data, error: likeError } = await supabase
      .from("news_likes")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .single();
    if (!likeError && data) hasLiked = true;
  }
  return { count: count || 0, hasLiked };
};

export const toggleArticleLike = async (articleId, userId, currentlyLiked) => {
  if (!articleId || !userId) return false;
  if (currentlyLiked) {
    const { error } = await supabase
      .from("news_likes").delete().eq("article_id", articleId).eq("user_id", userId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from("news_likes").insert({ article_id: articleId, user_id: userId });
    if (error) throw error;
    return true;
  }
};
