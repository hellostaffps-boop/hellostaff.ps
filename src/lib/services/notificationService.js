/**
 * notificationService.js — All notification-related Supabase operations.
 */
import { supabase } from "@/lib/supabaseClient";

export const createNotification = async ({ userEmail, title, message, type = "general", link = "" }) => {
  const { error } = await supabase.from("notifications").insert({
    user_email: userEmail, title, message, type, link, read: false,
  });
  if (error) console.error("[createNotification]", error);
};

export const getNotifications = async (userEmail) => {
  if (!userEmail) return [];
  const { data, error } = await supabase
    .from("notifications").select("*").eq("user_email", userEmail)
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
};

export const markNotificationRead = async (notifId) => {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notifId);
  if (error) throw error;
};

export const markAllNotificationsRead = async (userEmail) => {
  const { error } = await supabase
    .from("notifications").update({ read: true }).eq("user_email", userEmail).eq("read", false);
  if (error) throw error;
};

export const getUnreadNotificationsCount = async (userEmail) => {
  const { count, error } = await supabase
    .from("notifications").select("*", { count: "exact", head: true })
    .eq("user_email", userEmail).eq("read", false);
  if (error) throw error;
  return count || 0;
};

export const deleteNotification = async (notifId) => {
  const { error } = await supabase.from("notifications").delete().eq("id", notifId);
  if (error) throw error;
};

export const clearAllNotifications = async (userEmail) => {
  const { error } = await supabase.from("notifications").delete().eq("user_email", userEmail);
  if (error) throw error;
};
