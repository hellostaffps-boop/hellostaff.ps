/**
 * supabaseService.js — Backward-compatible barrel re-export.
 * All logic has been split into focused service modules under @/lib/services/.
 * Existing imports from "@/lib/supabaseService" continue to work unchanged.
 */

export * from "@/lib/services/profileService";
export * from "@/lib/services/organizationService";
export * from "@/lib/services/jobService";
export * from "@/lib/services/applicationService";
export * from "@/lib/services/notificationService";
export * from "@/lib/services/newsService";
export * from "@/lib/services/miscService";
