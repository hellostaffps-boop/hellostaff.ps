import { supabase } from "@/lib/supabaseClient";

export const getPublishedCourses = async (category = null) => {
  let query = supabase.from("academy_courses").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getCourseById = async (id) => {
  const { data, error } = await supabase.from("academy_courses").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};
