/**
 * storageService.js — Supabase Storage helper.
 * Replaces base44.integrations.Core.UploadFile
 */

import { supabase } from "@/lib/supabaseClient";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Whitelist of allowed MIME types per folder
const ALLOWED_MIME_TYPES = {
  "avatars": ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  "resumes": ["application/pdf"],
  "logos": ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"],
  "covers": ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  "team-photos": ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  "general": ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"],
};

const getAllowedTypes = (folder) => ALLOWED_MIME_TYPES[folder] || ALLOWED_MIME_TYPES["general"];

export const uploadFile = async (file, folder = "general") => {
  if (!file) throw new Error("No file provided");
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large (max 20MB)");

  // SECURITY FIX: Validate MIME type against whitelist
  const allowedTypes = getAllowedTypes(folder);
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}" for folder "${folder}". ` +
      `Allowed: ${allowedTypes.join(", ")}`
    );
  }

  // Improve filename generation using crypto for better randomness
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const uuid = crypto.randomUUID();
  const path = `${folder}/${uuid}.${ext}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadFile] Error:", error);
    if (error.message?.includes("bucket") || error.statusCode === 404) {
      throw new Error("Storage bucket 'uploads' not found or inaccessible.");
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
