# Hello Staff — Security Fixes Package v2 (base44 Removed)
**تاريخ:** 2026-04-27

---

## ما تم في هذه النسخة

### حذفات
- ✅ حذف مجلد `base44/` بالكامل (22 function + 23 entity)
- ✅ حذف `src/PHASE_42_ARCHITECTURE.md` (يتحدث عن Firebase)
- ✅ حذف كل إشارات `base44` و `Firebase` في التعليقات والتوثيق

### Edge Functions جديدة (Supabase Native)
| الدالة | المسار | الغرض |
|--------|--------|-------|
| `send-push` | `supabase/functions/send-push/index.ts` | Push notifications (محمية) |
| `bootstrap-admin-access` | `supabase/functions/bootstrap-admin-access/index.ts` | ترقية Super Admin |
| `admin-access-check` | `supabase/functions/admin-access-check/index.ts` | التحقق من صلاحية Admin |
| `admin-dashboard` | `supabase/functions/admin-dashboard/index.ts` | إحصائيات Dashboard |
| `admin-users` | `supabase/functions/admin-users/index.ts` | قائمة المستخدمين |
| `admin-stats` | `supabase/functions/admin-stats/index.ts` | إحصائيات مفصلة |
| `admin-seed-demo` | `supabase/functions/admin-seed-demo/index.ts` | إنشاء بيانات تجريبية |
| `admin-clear-demo` | `supabase/functions/admin-clear-demo/index.ts` | حذف بيانات تجريبية |
| `rate-limiter` | `supabase/functions/rate-limiter/index.ts` | Rate limiting server-side |

### ملفات src معدلة
| الملف | الإصلاح |
|-------|---------|
| `src/lib/supabaseClient.js` | إزالة fallback الخطير |
| `src/lib/adminService.js` | assertAdmin ثنائي الطبقة (async + server check) |
| `src/lib/services/jobService.js` | حماية deleteJob/updateJob |
| `src/lib/services/applicationService.js` | حماية التطبيقات والرسائل |
| `src/lib/services/notificationService.js` | حماية الإشعارات |
| `src/lib/storeService.js` | التحقق من الأسعار من الخادم |
| `src/lib/storageService.js` | whitelist MIME types |
| `src/lib/demoData.js` | إزالة localStorage demo mode |
| `src/lib/sanitizeHtml.js` | مُطهر XSS (جديد) |
| `src/lib/notificationHelpers.js` | تغيير handleFirebaseError → handleSupabaseError |
| `src/hooks/useSavedJobs.js` | تغيير firebaseUser → user |
| `src/pages/Contact.jsx` | تحديث الإيميل إلى staffps.com |
| `src/pages/PrivacyPolicy.jsx` | تحديث الإيميل إلى staffps.com |
| `src/pages/TermsOfService.jsx` | تحديث الإيميل إلى staffps.com |
| `src/App.jsx` | إصلاح AdminNotifications route |
| `src/SECURITY_NOTES.md` | توثيق أمني محدّث (Supabase) |
| `src/ADMIN_SECURITY.md` | دليل الإدارة (Supabase) |
| `src/components/AdminProtectedRoute.jsx` | إزالة إشارات base44 |
| `vercel.json` | إضافة CSP Headers |

### ملف SQL
| الملف | المحتوى |
|-------|---------|
| `hellostaff_security_patch.sql` | RLS لـ 25+ جدول + RPC functions (idempotent, fault-tolerant) |

---

## كيفية التطبيق

### 1. فك الضغط
```bash
unzip hellostaff-security-fixes.zip
cd hellostaff-security-fixes
```

### 2. نسخ الملفات
```bash
# نفترض أن مشروعك في ../hellostaff.ps

# نسخ src/
cp -r src/* ../hellostaff.ps/src/

# نسخ Edge Functions
cp -r supabase/functions/* ../hellostaff.ps/supabase/functions/

# نسخ vercel.json
cp vercel.json ../hellostaff.ps/

# نسخ SQL
cp hellostaff_security_patch.sql ../hellostaff.ps/
```

### 3. تثبيت gsap (إذا لم تكن مثبتة)
```bash
cd ../hellostaff.ps
npm install gsap isomorphic-dompurify
```

### 4. التحقق من حذف base44
```bash
# يجب أن لا يوجد مجلد base44
ls base44  # ← يجب أن يظهر: No such file or directory

# يجب أن لا توجد إشارات في src/
grep -rn "base44" src/ || echo "Clean - no base44 references"
```

### 5. رفع الكود
```bash
git add .
git commit -m "Security hardening v2: Remove base44/Firebase, add Supabase Edge Functions, fix RLS/XSS/auth"
git push origin main
```

### 6. نشر Edge Functions
```bash
supabase functions deploy send-push --project-ref YOUR_PROJECT_REF
supabase functions deploy bootstrap-admin-access --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-access-check --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-dashboard --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-users --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-stats --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-seed-demo --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-clear-demo --project-ref YOUR_PROJECT_REF
supabase functions deploy rate-limiter --project-ref YOUR_PROJECT_REF
```

### 7. تشغيل SQL
1. افتح Supabase Dashboard → SQL Editor
2. انسخ محتوى `hellostaff_security_patch.sql`
3. اضغط Run

### 8. ضبط Secrets
```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="your-key" \
  VAPID_PRIVATE_KEY="your-key" \
  VAPID_SUBJECT="mailto:support@staffps.com" \
  ALLOWED_ORIGIN="https://www.staffps.com,https://staffps.com" \
  SUPER_ADMIN_EMAIL="admin@staffps.com" \
  --project-ref YOUR_PROJECT_REF
```

---

## التحقق من النجاح

```bash
# التحقق من حذف base44
grep -rn "base44" ../hellostaff.ps/src/ || echo "✅ base44 removed"

# التحقق من Edge Functions
supabase functions list --project-ref YOUR_PROJECT_REF

# التحقق من RLS
# (في Supabase SQL Editor)
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

---

## ملاحظة مهمة

**يجب حذف مجلد `base44/` من المشروع الأصلي يدوياً إذا كان لا يزال موجوداً:**
```bash
rm -rf base44/
git add base44/
git commit -m "Remove base44 legacy code"
git push origin main
```
