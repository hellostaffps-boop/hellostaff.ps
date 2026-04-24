/**
 * subscriptionService.js — Manages employer subscriptions.
 * Uses manual payment (bank transfer / wallet) with admin activation.
 */

import { supabase } from "@/lib/supabaseClient";

// ─── Plan Definitions ────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id: "free",
    price: 0,
    currency: "ILS",
    duration_days: 30,
    jobs_limit: 1,
    label_ar: "مجاني (لفترة محدودة)",
    label_en: "Free (Trial)",
    desc_ar: "وظيفة واحدة لتجربة المنصة",
    desc_en: "1 job post to try the platform",
  },
  monthly: {
    id: "monthly",
    price: 100,
    currency: "ILS",
    duration_days: 30,
    jobs_limit: 5,
    label_ar: "شهري",
    label_en: "Monthly",
    desc_ar: "5 وظائف لمدة شهر",
    desc_en: "5 job posts for 1 month",
  },
  annual: {
    id: "annual",
    price: 1000,
    currency: "ILS",
    duration_days: 365,
    jobs_limit: 45,
    label_ar: "سنوي",
    label_en: "Annual",
    desc_ar: "45 وظيفة لمدة سنة",
    desc_en: "45 job posts for 1 year",
  },
  premium: {
    id: "premium",
    price: 1500,
    currency: "ILS",
    duration_days: 365,
    jobs_limit: -1, // unlimited
    label_ar: "بريميوم",
    label_en: "Premium",
    desc_ar: "عدد غير محدود من الوظائف لمدة سنة",
    desc_en: "Unlimited job posts for 1 year",
  },
};

// ─── Get Active Subscription ─────────────────────────────────────────────────
export const getActiveSubscription = async (orgId) => {
  if (!orgId) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error("[getActiveSubscription]", error);
  return data || null;
};

// ─── Activate Free Plan (Instant) ───────────────────────────────────────────
export const activateFreePlan = async (orgId, ownerEmail) => {
  const plan = PLANS.free;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      organization_id: orgId,
      owner_email: ownerEmail,
      plan: plan.id,
      status: "active",
      jobs_limit: plan.jobs_limit,
      jobs_used: 0,
      amount: plan.price,
      currency: plan.currency,
      payment_method: "free_tier",
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Get Subscription for Org (any status) ───────────────────────────────────
export const getOrgSubscriptions = async (orgId) => {
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) console.error("[getOrgSubscriptions]", error);
  return data || [];
};

// ─── Check if Can Publish Job ────────────────────────────────────────────────
export const canPublishJob = async (orgId) => {
  const sub = await getActiveSubscription(orgId);
  if (!sub) return { allowed: false, reason: "no_subscription", subscription: null };
  if (sub.jobs_limit === -1) return { allowed: true, reason: "unlimited", subscription: sub };
  if (sub.jobs_used >= sub.jobs_limit) return { allowed: false, reason: "limit_reached", subscription: sub };
  return { allowed: true, reason: "ok", subscription: sub };
};

// ─── Increment Jobs Used ─────────────────────────────────────────────────────
export const incrementJobsUsed = async (subscriptionId) => {
  const { data, error } = await supabase.rpc("increment_jobs_used", { sub_id: subscriptionId });
  if (error) {
    // Fallback: manual increment
    const { data: sub } = await supabase.from("subscriptions").select("jobs_used").eq("id", subscriptionId).single();
    if (sub) {
      await supabase.from("subscriptions").update({ jobs_used: (sub.jobs_used || 0) + 1 }).eq("id", subscriptionId);
    }
  }
  return data;
};

// ─── Create Subscription Request ─────────────────────────────────────────────
export const uploadPaymentReceipt = async (file, orgId) => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${orgId}/${Date.now()}.${fileExt}`;
  const filePath = `receipts/${fileName}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("uploads")
    .getPublicUrl(filePath);

  return publicUrl;
};

export const createSubscriptionRequest = async ({ orgId, ownerEmail, planId, paymentMethod, paymentReference, receiptUrl }) => {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      organization_id: orgId,
      owner_email: ownerEmail,
      plan: planId,
      status: "pending",
      jobs_limit: plan.jobs_limit,
      jobs_used: 0,
      amount: plan.price,
      currency: plan.currency,
      payment_method: paymentMethod || "bank_transfer",
      payment_reference: paymentReference || "",
      receipt_url: receiptUrl || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Admin: Get All Subscriptions ────────────────────────────────────────────
export const getAllSubscriptions = async () => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── Admin: Activate Subscription ────────────────────────────────────────────
export const activateSubscription = async (subscriptionId, adminEmail) => {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (!sub) throw new Error("Subscription not found");

  const plan = PLANS[sub.plan];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (plan?.duration_days || 30) * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      activated_by: adminEmail,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Admin: Cancel Subscription ──────────────────────────────────────────────
export const cancelSubscription = async (subscriptionId) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Payment Settings ────────────────────────────────────────────────────────
export const getPaymentSettings = async () => {
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") console.error("[getPaymentSettings]", error);
  return data || null;
};

export const savePaymentSettings = async (settings) => {
  const existing = await getPaymentSettings();
  if (existing) {
    const { data, error } = await supabase
      .from("payment_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("payment_settings")
      .insert(settings)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
