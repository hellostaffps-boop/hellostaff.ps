/**
 * storageService.js — Supabase Storage helper.
 * Replaces base44.integrations.Core.UploadFile
 */

import { supabase } from "@/lib/supabaseClient";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const uploadFile = async (file, folder = "general") => {
  if (!file) throw new Error("No file provided");
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large (max 20MB)");

  const ext = file.name.split(".").pop();
  const randomName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${randomName}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Fallback: if bucket doesn't exist, create it first
    if (error.message?.includes("bucket") || error.statusCode === 404) {
      throw new Error("Storage bucket 'uploads' not found. Please create it in Supabase dashboard.");
    }
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("uploads")
    .getPublicUrl(path);

  return { file_url: publicUrl, path };
};

export const uploadAvatar = (file) => uploadFile(file, "avatars");
export const uploadResume = (file) => uploadFile(file, "resumes");
export const uploadLogo = (file) => uploadFile(file, "logos");
export const uploadCover = (file) => uploadFile(file, "covers");
export const uploadTeamPhoto = (file) => uploadFile(file, "team-photos");
