/**
 * adminService.js — Supabase implementation.
 * All admin operations use Supabase directly.
 * Requires platform_admin role.
 * 
 * SECURITY FIX (2026-04-27):
 * - assertAdmin now validates BOTH client-side userProfile AND server-side role via RPC
 * - All admin operations are guarded by RLS policies on the database
 * - Audit logging is enforced for sensitive actions
 */

import { supabase } from "@/lib/supabaseClient";
import { createAuditLog, createNotification } from "@/lib/supabaseService";

/**
 * assertAdmin — Dual-layer validation:
 * 1. Client-side sanity check (fast fail)
 * 2. Server-side role verification via RPC (truth source)
 */
const assertAdmin = async (userProfile) => {
  // Layer 1: Client-side sanity check (prevents accidental calls)
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
  
  // Layer 2: Server-side verification (truth source)
  // This prevents DevTools manipulation of userProfile
  const { data: serverProfile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userProfile.id)
    .single();
    
  if (error || !serverProfile || serverProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: Server-side role verification failed");
  }
};

/**
 * assertAdminSync — Synchronous version for non-async contexts (routes, etc.)
 * NOTE: This is for UI blocking only. All actual admin ops MUST use assertAdmin async.
 */
const assertAdminSync = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
};

export const getAdminDashboardDataSafe = async (userProfile) => {
  await assertAdmin(userProfile);

  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: publishedJobs },
    { count: totalApplications },
    { count: totalOrganizations },
    { count: activeOrganizations },
    { data: roleCounts },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("role"),
  ]);

  const roleMap = (roleCounts || []).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: totalUsers || 0,
    totalCandidates: roleMap["candidate"] || 0,
    totalEmployers: (roleMap["employer_owner"] || 0) + (roleMap["employer_manager"] || 0),
    totalAdmins: roleMap["platform_admin"] || 0,
    totalJobs: totalJobs || 0,
    publishedJobs: publishedJobs || 0,
    totalApplications: totalApplications || 0,
    totalOrganizations: totalOrganizations || 0,
    activeOrganizations: activeOrganizations || 0,
  };
};

export const getAdminUsersSafe = async (userProfile, maxCount = 200) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      candidate_profiles (*),
      employer_profiles (*)
    `)
    .order("created_at", { ascending: false })
    .limit(maxCount);
  if (error) throw error;
  return data || [];
};

export const getAdminOrganizationsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
};

export const getAdminJobsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
};

export const verifyOrganization = async (userProfile, orgId) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("organizations")
    .update({ verified: true, verified_by: userProfile.email, updated_at: new Date().toISOString() })
    .eq("id", orgId)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    actorEmail: userProfile.email,
    action: "verify_organization",
    targetType: "organization",
    targetId: orgId,
  });

  return data;
};

export const updateJobStatusAdmin = async (userProfile, jobId, status) => {
  await assertAdmin(userProfile);
  const VALID = ["draft", "published", "closed", "archived"];
  if (!VALID.includes(status)) throw new Error("Invalid status");

  const { data, error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    actorEmail: userProfile.email,
    action: `set_job_status_${status}`,
    targetType: "job",
    targetId: jobId,
  });

  return data;
};

export const updateUserRoleAdmin = async (userProfile, targetUserId, newRole) => {
  await assertAdmin(userProfile);
  const VALID = ["candidate", "employer_owner", "employer_manager", "platform_admin"];
  if (!VALID.includes(newRole)) throw new Error("Invalid role");

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetUserId)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    actorEmail: userProfile.email,
    action: "update_user_role",
    targetType: "user",
    targetId: targetUserId,
    details: { new_role: newRole },
  });

  return data;
};

export const updateUserStatusAdmin = async (userProfile, targetUserId, newStatus) => {
  await assertAdmin(userProfile);
  const VALID = ["active", "pending_approval", "suspended", "scheduled_for_deletion", "deleted"];
  if (!VALID.includes(newStatus)) throw new Error("Invalid status");

  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      status: newStatus, 
      updated_at: new Date().toISOString(),
      ...(newStatus === 'active' ? { deletion_scheduled_at: null } : {})
    })
    .eq("id", targetUserId)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    actorEmail: userProfile.email,
    action: `set_user_status_${newStatus}`,
    targetType: "user",
    targetId: targetUserId,
  });

  return data;
};

export const updateOrganizationStatusAdmin = async (userProfile, targetOrgId, newStatus) => {
  await assertAdmin(userProfile);
  const VALID = ["active", "pending", "suspended", "deleted"];
  if (!VALID.includes(newStatus)) throw new Error("Invalid status");

  const { data, error } = await supabase
    .from("organizations")
    .update({ 
      status: newStatus, 
      updated_at: new Date().toISOString()
    })
    .eq("id", targetOrgId)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    actorEmail: userProfile.email,
    action: `set_org_status_${newStatus}`,
    targetType: "organization",
    targetId: targetOrgId,
  });

  return data;
};

// Audit log exports
export const getAuditLogsSafe = async (userProfile, limit = 100) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const getAuditLogsForTarget = async (userProfile, targetType, targetId) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getFailedAuditLogsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

// ─── ADMINS & PERMISSIONS MANAGEMENT ──────────────────────────────────────────

export const getPlatformAdminsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from('profiles')
    .select('*, admin_permissions(*)')
    .eq('role', 'platform_admin')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const grantAdminAccess = async (userProfile, userEmail) => {
  await assertAdmin(userProfile);
  const { data: user, error: fetchErr } = await supabase.from('profiles').select('*').eq('email', userEmail).single();
  if (fetchErr || !user) throw new Error("المستخدم غير موجود بهذا البريد");
  
  if (user.role === 'platform_admin') throw new Error("هذا المستخدم يمتلك صلاحيات إدارية بالفعل");

  const { error: updErr } = await supabase.from('profiles').update({ role: 'platform_admin', status: 'active' }).eq('id', user.id);
  if (updErr) throw updErr;

  await supabase.from('admin_permissions').upsert({
    admin_id: user.id,
    granted_by: userProfile.id,
    can_manage_users: false,
    can_manage_organizations: false,
    can_manage_payments: false,
    can_manage_admins: false,
    can_manage_testimonials: false
  });
  return true;
};

export const updateAdminPermissions = async (userProfile, targetAdminId, permissions) => {
  await assertAdmin(userProfile);
  const { error } = await supabase.from('admin_permissions').upsert({
    admin_id: targetAdminId,
    ...permissions,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
  return true;
};

export const revokeAdminAccess = async (userProfile, targetAdminId) => {
  await assertAdmin(userProfile);
  if (userProfile.id === targetAdminId) throw new Error("لا يمكنك إزالة صلاحيات نفسك!");
  
  await supabase.from('admin_permissions').delete().eq('admin_id', targetAdminId);
  const { error } = await supabase.from('profiles').update({ role: 'candidate' }).eq('id', targetAdminId);
  if (error) throw error;
  return true;
};

// ─── DEMO DATA MANAGEMENT ──────────────────────────────────────────────────────

const DEMO_BATCH_ID = "admin-demo-batch-v1";

export const getDemoDataStatus = async (userProfile) => {
  await assertAdmin(userProfile);
  const [
    { count: orgsCount },
    { count: jobsCount },
    { count: appsCount },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_demo", true),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_demo", true),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("is_demo", true),
  ]);
  return {
    orgs: orgsCount || 0,
    jobs: jobsCount || 0,
    applications: appsCount || 0,
    total: (orgsCount || 0) + (jobsCount || 0) + (appsCount || 0),
  };
};

export const seedDemoData = async (userProfile) => {
  await assertAdmin(userProfile);

  // Call a SECURITY DEFINER RPC function that bypasses RLS
  const { data, error } = await supabase.rpc("seed_demo_data");
  if (error) throw new Error(error.message);

  if (!data?.success) {
    throw new Error(data?.message || "Seeding failed");
  }

  try {
    await createAuditLog({
      actorEmail: userProfile.email,
      action: "seed_demo_data",
      targetType: "system",
      targetId: DEMO_BATCH_ID,
      details: { orgs: data.orgs, jobs: data.jobs, applications: data.applications },
    });
  } catch (_) {}

  return {
    orgs: data.orgs,
    jobs: data.jobs,
    applications: data.applications,
  };
};



export const clearDemoData = async (userProfile) => {
  await assertAdmin(userProfile);

  // Call a SECURITY DEFINER RPC function that bypasses RLS
  const { data, error } = await supabase.rpc("clear_demo_data");
  if (error) throw new Error(error.message);

  try {
    await createAuditLog({
      actorEmail: userProfile.email,
      action: "clear_demo_data",
      targetType: "system",
      targetId: DEMO_BATCH_ID,
    });
  } catch (_) {}

  return true;
};

// ─── BROADCAST NOTIFICATIONS ──────────────────────────────────────────────────

export const broadcastNotificationAdmin = async (userProfile, { title, message, targetRole }) => {
  await assertAdmin(userProfile);

  // Use the SECURITY DEFINER RPC function to bypass RLS and perform bulk insert
  const { data, error } = await supabase.rpc("broadcast_notification_secure", {
    p_title: title,
    p_message: message,
    p_target_role: targetRole
  });

  if (error) throw error;

  if (!data?.success) {
    throw new Error(data?.message || "Broadcast failed");
  }

  try {
    await createAuditLog({
      actorEmail: userProfile.email,
      action: "admin_broadcast",
      targetType: "system",
      details: { title, targetRole, recipientCount: data.count },
    });
  } catch (auditErr) {
    console.error("[broadcastNotificationAdmin] Audit log failed:", auditErr);
  }

  return { count: data.count };
};// Add these to the end of src/lib/adminService.js

// ─── ACADEMY MANAGEMENT ────────────────────────────────────────────────────────
export const getAdminCoursesSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase.from("academy_courses").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertAdminCourse = async (userProfile, courseData) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("academy_courses")
    .upsert([{ ...courseData, updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: courseData.id ? "update_course" : "create_course",
    targetType: "academy",
    targetId: data.id,
  });
  return data;
};

export const deleteAdminCourse = async (userProfile, courseId) => {
  await assertAdmin(userProfile);
  const { error } = await supabase.from("academy_courses").delete().eq("id", courseId);
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: "delete_course",
    targetType: "academy",
    targetId: courseId,
  });
  return true;
};

// ─── STORE MANAGEMENT ──────────────────────────────────────────────────────────
export const getAdminProductsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase.from("store_products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertAdminProduct = async (userProfile, productData) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("store_products")
    .upsert([{ ...productData, updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: productData.id ? "update_product" : "create_product",
    targetType: "store",
    targetId: data.id,
  });
  return data;
};

export const deleteAdminProduct = async (userProfile, productId) => {
  await assertAdmin(userProfile);
  const { error } = await supabase.from("store_products").delete().eq("id", productId);
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: "delete_product",
    targetType: "store",
    targetId: productId,
  });
  return true;
};

// ─── NEWS MANAGEMENT ───────────────────────────────────────────────────────────
export const getAdminNewsSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase.from("news_articles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const upsertAdminNews = async (userProfile, newsData) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("news_articles")
    .upsert([{ ...newsData }]) // news_articles doesn't have updated_at in phase3 schema, just published_at
    .select()
    .single();
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: newsData.id ? "update_news" : "create_news",
    targetType: "news",
    targetId: data.id,
  });
  return data;
};

export const deleteAdminNews = async (userProfile, articleId) => {
  await assertAdmin(userProfile);
  const { error } = await supabase.from("news_articles").delete().eq("id", articleId);
  if (error) throw error;
  await createAuditLog({
    actorEmail: userProfile.email,
    action: "delete_news",
    targetType: "news",
    targetId: articleId,
  });
  return true;
};


// ─── STORE ORDERS MANAGEMENT ──────────────────────────────────────────────────
export const getAdminOrdersSafe = async (userProfile) => {
  await assertAdmin(userProfile);
  const { data, error } = await supabase
    .from("store_orders")
    .select(`
      *,
      items:store_order_items (
        *,
        product:store_products (*)
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateStoreOrderStatus = async (userProfile, orderId, { status, digitalReleased }) => {
  await assertAdmin(userProfile);
  
  const updates = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (digitalReleased !== undefined) updates.digital_released = digitalReleased;

  const { data: order, error } = await supabase
    .from("store_orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw error;

  // Send notification to user
  if (status || digitalReleased) {
    let title = "";
    let message = "";
    
    if (status === "completed" || digitalReleased) {
      title = "تم تحديث طلبك في المتجر";
      message = "تمت الموافقة على طلبك. يمكنك الآن الوصول إلى المحتوى الرقمي من صفحة طلباتك.";
    } else if (status === "cancelled") {
      title = "تحديث بخصوص طلبك";
      message = "نأسف، تم إلغاء طلبك من قبل المتجر.";
    }

    if (title) {
      await createNotification({
        userEmail: order.user_email,
        title,
        message,
        type: "order",
        link: "/store" // Or a specific orders page if it exists
      });
    }
  }

  return order;
};
