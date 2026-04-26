# التقرير الأمني المدمج الشامل — Hello Staff
**تاريخ التقرير:** 2026-04-27  
**المصدر:** تحليل شيفرة مصدرية + تقرير PDF مرجعي  
**المستودع:** https://github.com/hellostaffps-boop/hellostaff.ps  
**حالة المنصة:** غير جاهزة للإنتاج بدون إصلاحات فورية

---

## 1. نظرة عامة

منصة Hello Staff هي منصة توظيف متخصصة (F&B / Hospitality) مبنية على:
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Edge Functions:** Deno/Supabase Functions (send-push)
- **مدفوعات:** Stripe
- **PWA:** vite-plugin-pwa
- **عدد الملفات:** ~310 ملف
- **الأدوار:** candidate, employer_owner, employer_manager, platform_admin

**الأنظمة الفرعية:**
- إدارة الوظائف (نشر / تعديل / حذف)
- التقديمات والمراسلة
- نظام الإشعارات
- نظام الاشتراكات (Stripe)
- الأكاديمية والمتجر
- لوحة الإدارة (Admin Dashboard)
- نظام الفريق (Team Members)

---

## 2. خارطة الثغرات حسب الخطورة

### 🔴 حرجة CRITICAL (6 ثغرات + 3 إضافية من التحليل)

| الكود | الثغرة | الموقع | التأثير |
|-------|--------|--------|---------|
| **CRIT-001** | Admin Self-Escalation | `base44/functions/bootstrapAdminAccess/entry.ts` | أي مستخدم مصدق يستطيع ترقية نفسه إلى `platform_admin` |
| **CRIT-002** | Broadcast RPC مفتوحة | `admin_broadcast_rpc.sql:55` | أي مستخدم مصدق يستطيع إرسال إشعارات جماعية |
| **CRIT-003** | Demo RPC مفتوحة | `phase6_demo_rpc.sql:159` | أي مستخدم مصدق يستطيع إنشاء/حذف بيانات تجريبية |
| **CRIT-004** | Push API بدون تحقق | `supabase/functions/send-push/index.ts` | إرسال Push Notifications لأي مستخدم بدون تصريح |
| **CRIT-005** | Audit Log Forgery | `supabase_schema.sql` | أي مستخدم يستطيع تزوير سجلات التدقيق |
| **CRIT-006** | Edge Functions تستخدم `btoa(password)` | `base44/functions/getAdminAccessState/entry.ts` | مقارنة session_token ضعيفة بـ `btoa(adminPassword)` |
| **CRIT-007** | `assertAdmin` Client-Side فقط | `src/lib/adminService.js` | تعديل `userProfile` في المتصفح = صلاحيات إدارية كاملة |
| **CRIT-008** | `deleteJob` / `updateJob` غير محميتين | `src/lib/services/jobService.js` | حذف/تعديل أي وظيفة بدون تحقق |
| **CRIT-009** | Rate Limiting Client-Side فقط | `src/lib/rateLimiter.js` | يُتجاوز بإعادة تحميل الصفحة |

### 🟠 عالية HIGH (8 ثغرات)

| الكود | الثغرة | الموقع |
|-------|--------|--------|
| **HIGH-001** | VAPID Public Key Hardcoded | `supabase/functions/send-push/index.ts:11` |
| **HIGH-002** | CORS `*` مفتوح | `supabase/functions/send-push/index.ts:18` |
| **HIGH-003** | `candidate_profiles` عامة للقراءة | `supabase_schema.sql` |
| **HIGH-004** | `notify_matching_candidates` لا تتحقق | `supabase_optimized_notifications.sql` |
| **HIGH-005** | Admin Functions تعتمد على `session_token` | `base44/functions/getAdminJobs/entry.ts` |
| **HIGH-006** | Firebase Admin Credentials في Edge Functions | `base44/functions/` |
| **HIGH-007** | `createApplication` / `updateApplication` غير محميتين | `src/lib/services/applicationService.js` |
| **HIGH-008** | تزوير `sender_email` في الرسائل | `src/lib/services/applicationService.js` |

### 🟡 متوسطة MEDIUM (7 ثغرات)

| الكود | الثغرة | الموقع |
|-------|--------|--------|
| **MED-001** | XSS عبر `dangerouslySetInnerHTML` + Markdown | `src/pages/TermsOfService.jsx`, `PrivacyPolicy.jsx` |
| **MED-002** | `payment_settings` عامة للقراءة | `phase2_schema.sql` |
| **MED-003** | Storage MIME Type Injection | `src/lib/storageService.js` |
| **MED-004** | Bucket "uploads" عام للقراءة | `create_uploads_bucket.sql` |
| **MED-005** | خطأ استيراد `gsap` | `src/pages/ComingSoonPage.jsx` |
| **MED-006** | `profile_views` مفتوحة للإدخال | `phase2_schema.sql` |
| **MED-007** | Demo Mode يعتمد على `localStorage` | `src/lib/demoData.js` |

### 🟢 منخفضة LOW (5 ثغرات)

| الكود | الثغرة | الموقع |
|-------|--------|--------|
| **LOW-001** | لا يوجد Rate Limiting على تسجيل الدخول | `src/pages/auth/Login.jsx` |
| **LOW-002** | Supabase Client يستخدم Fallback | `src/lib/supabaseClient.js` |
| **LOW-003** | مشاكل UTF-8 في البناء | `build_error_utf8.txt` |
| **LOW-004** | لا يوجد CSP Header | `vercel.json` |
| **LOW-005** | نسخة Manifest ثابتة | `vite.config.js` |

---

## 3. وصف تفصيلي للثغرات الحرجة

### CRIT-001: Admin Self-Escalation (bootstrapAdminAccess)

**الملف:** `base44/functions/bootstrapAdminAccess/entry.ts`

```ts
const user = await base44.auth.me();
await base44.auth.updateMe({ role: 'platform_admin' });
```

**المشكلة:** الدالة لا تتحقق من أي شرط قبل ترقية المستخدم. أي شخص لديه حساب مصدق يستطيع استدعاء `bootstrapAdminAccess` ويصبح `platform_admin`.

**الإصلاح:** إضافة فحص كلمة مرور الإدارة + `SUPER_ADMIN_EMAIL` + إنشاء RPC محمية بدلاً من Edge Function.

---

### CRIT-002: broadcast_notification_secure مفتوحة لـ authenticated

**الملف:** `admin_broadcast_rpc.sql:55`

```sql
GRANT EXECUTE ON FUNCTION public.broadcast_notification_secure(...) TO authenticated;
```

**المشكلة:** الدالة من نوع `SECURITY DEFINER` (تتجاوز RLS) ومتاحة لأي مستخدم مصدق. يمكن إرسال إشعارات جماعية لجميع المستخدمين.

**الإصلاح:** تغيير `TO authenticated` إلى `TO service_role` أو إضافة فحص `platform_admin` داخل الدالة.

---

### CRIT-003: seed_demo_data / clear_demo_data مفتوحتان

**الملف:** `phase6_demo_rpc.sql:159-160`

```sql
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;
```

**المشكلة:** أي مستخدم يستطيع إنشاء بيانات تجريبية (منظمات, وظائف, تطبيقات) أو حذفها.

**الإصلاح:** تغيير إلى `TO service_role` أو إضافة فحص `platform_admin`.

---

### CRIT-004: Push API بدون تحقق من هوية المرسل

**الملف:** `supabase/functions/send-push/index.ts`

```ts
const { user_id, title, body, data } = await req.json();
// لا يوجد فحص: auth.uid() === user_id
```

**المشكلة:** أي مستخدم يستطيع إرسال Push Notification لأي `user_id` آخر ( phishing / harassment ).

**الإصلاح:** التحقق من `auth.uid()` أو إضافة RLS على `push_subscription`.

---

### CRIT-005: Audit Log Forgery

**الملف:** `supabase_schema.sql`

```sql
CREATE POLICY "System can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
```

**المشكلة:** أي مستخدم يستطيع إنشاء سجلات تدقيق وهمية، مما يُبطل قيمة Audit Trail.

**الإصلاح:** `WITH CHECK (public.get_user_role() = 'platform_admin')` أو تقييد الإدراج على RPC functions فقط.

---

### CRIT-006: Edge Functions تستخدم `btoa(password)` كـ session_token

**الملفات:** `base44/functions/getAdminAccessState/entry.ts`, `getAdminJobs/entry.ts`

```ts
const isValid = session_token === btoa(adminPassword);
```

**المشكلة:**
1. `btoa` هو Base64 — يُفك تشفيره بسهولة
2. مقارنة نصية سطحية (`===`) — لا تستخدم JWT أو session cryptographically secure
3. `session_token` ثابت (يعتمد على كلمة المرور فقط) — لا يوجد expiration
4. Side-Channel Timing Attack: المقارنة النصية يمكن استغلالها

**الإصلاح:** استخدام JWT مع secret + expiration + استخدام `crypto.timingSafeEqual`.

---

### CRIT-007: assertAdmin Client-Side فقط

**الملف:** `src/lib/adminService.js:10-14`

```js
const assertAdmin = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
};
```

**المشكلة:** `userProfile` يأتي من Client-Side Context. يمكن تعديله عبر DevTools لتجاوز الفحص.

**الإصلاح:** نقل `assertAdmin` إلى Supabase RPC `SECURITY DEFINER` + إزالة الثقة بأي client-side role claim.

---

### CRIT-008: deleteJob / updateJob غير محميتين

**الملف:** `src/lib/services/jobService.js:127-138`

```js
export const deleteJob = async (jobId) => {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw error;
};
```

**المشكلة:** لا تتحقق من هوية المستخدم أو ملكية الوظيفة.

**الإصلاح:** إضافة فحص `organization_id` عبر `employerProfile` + تحديث RLS.

---

### CRIT-009: Rate Limiting Client-Side فقط

**الملف:** `src/lib/rateLimiter.js`

```js
const actionTimestamps = {}; // في ذاكرة المتصفح
```

**المشكلة:** يُتجاوز بإعادة تحميل الصفحة أو استخدام cURL مباشر.

**الإصلاح:** نقل rate limiting إلى Supabase Edge Functions أو PostgreSQL (pg_net / pg_cron).

---

## 4. الثغرات العالية — وصف تفصيلي

### HIGH-001: VAPID Public Key Hardcoded

```ts
const PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || 
  "BEfDH9JxK_6JHOJYrF9mij6IGdK9PND-JwN4vr3Jn2-YOetDpWq603Ai2_3zHbsT9EUE1pZaIVnuZL-vv4MbODs";
```

**الإصلاح:** إزالة fallback وإرجاع خطأ 500 إذا لم يُضبط المفتاح.

---

### HIGH-002: CORS `*`

```ts
"Access-Control-Allow-Origin": "*"
```

**الإصلاح:** تبديل إلى `https://hellostaff.ps` أو مصادر معروفة.

---

### HIGH-003: candidate_profiles عامة للقراءة

```sql
CREATE POLICY "Anyone can read candidate profiles" ON public.candidate_profiles FOR SELECT USING (true);
```

**المشكلة:** جميع بيانات المرشحين (سيرة ذاتية, هاتف, مدينة, مهارات) متاحة للعامة.

**الإصلاح:**
- المرشح: يقرأ ملفه فقط
- صاحب العمل: يقرأ فقط المرشحين الذين تقدموا لوظائفه
- الإدارة: يقرأ الكل

---

### HIGH-007: createApplication / updateApplication غير محميتين

**الملف:** `src/lib/services/applicationService.js:85-90`

```js
export const createApplication = async (data) => {
  const { data: app, error } = await supabase
    .from("applications").insert({ ...data, status: "pending" }).select().single();
```

**المشكلة:** غير محمية — يمكن إنشاء تطبيقات وهمية أو تعديل تطبيقات الآخرين.

**الإصلاح:** التحقق من `candidate_email` مقابل `auth.uid()`.

---

## 5. الأخطاء البرمجية (Bugs)

### 5.1 ملف فارغ
- `src/lib/adminServiceExtensions.js` — فارغ تماماً

### 5.2 اسم ملف غريب
- `src/components/NotificationDrawer.jsx旋` — يحتوي على حرف صيني `旋`

### 5.3 توثيق قديم ومضلل
- `src/SECURITY_NOTES.md` — يتحدث عن Firebase/Firestore
- `src/ADMIN_SECURITY.md` — يتحدث عن Firebase

### 5.4 تكرار في SQL
- `supabase_admin_rls.sql` — الأسطر 44-63 مكررة من 25-43

### 5.5 خطأ استيراد gsap
- `src/pages/ComingSoonPage.jsx` — `[vite]: Rollup failed to resolve import "gsap"`

### 5.6 إشعارات الإدارة تستخدم مكون المرشح
- `src/App.jsx:81` — `AdminNotifications = lazy(() => import('./pages/candidate/Notifications'))`

### 5.7 Supabase Client fallback خطير
- `src/lib/supabaseClient.js:9` — يستخدم `"placeholder"` بدلاً من التوقف

---

## 6. توصيات الإصلاح حسب الأولوية

### فورية (24-48 ساعة)

1. **إيقاف** `bootstrapAdminAccess` Edge Function مؤقتاً
2. **تغيير** `GRANT EXECUTE` لـ `broadcast_notification_secure`, `seed_demo_data`, `clear_demo_data` إلى `service_role`
3. **إصلاح** Audit Log Policy: `WITH CHECK (true)` → `WITH CHECK (public.get_user_role() = 'platform_admin')`
4. **إضافة** `auth.uid() === user_id` في Push Function
5. **إزالة** `btoa(adminPassword)` من Edge Functions
6. **إخفاء** كلمة مرور الإدارة من source code واستخدام Supabase Secrets

### قصيرة (1-2 أسبوع)

7. **إكمال RLS Policies** لـ: `jobs`, `organizations`, `candidate_profiles`, `employer_profiles`
8. **إضافة authorization** لـ `deleteJob`, `updateJob`, `updateApplication`
9. **نقل `assertAdmin`** إلى Supabase RPC
10. **إضافة DOMPurify** لـ `dangerouslySetInnerHTML`
11. **إصلاح** `candidate_profiles` policy (لا ينبغي أن تكون عامة)
12. **إصلاح** CORS في Edge Functions
13. **إزالة** VAPID key hardcoded

### متوسطة (1 شهر)

14. **تدقيق شامل** لجميع Service functions
15. **نقل Rate Limiting** إلى Server-Side
16. **إضافة CSP Headers**
17. **تحديث التوثيق** ليعكس Supabase
18. **إضافة Input Validation** على مستوى PostgreSQL (CHECK constraints)
19. **اختبار RLS** عبر `supabase test` أو `pgTAP`
20. **مراجعة** Storage Policies (حالياً عامة جداً)

---

## 7. ملاحظة نهائية

**المنصة غير جاهزة للإنتاج.**

يوجد **تناقض بنيوي** في المشروع:
- الجزء الأكبر يستخدم **Supabase** (auth, DB, functions)
- لكن توجد بقايا **base44** (Edge Functions, SDK, Auth)
- وتوثيق يتحدث عن **Firebase**

هذا يشير إلى **هجرة غير مكتملة** من base44/Firebase إلى Supabase. إذا كانت Edge Functions من base44 لا تزال حية في الإنتاج، فإن CRIT-001 و CRIT-006 و HIGH-005 و HIGH-006 تمثل **تهديدات فورية**.

**التوصية الفورية:** تعطيل جميع Edge Functions الخاصة بـ base44 حتى يتم إصلاحها.

---
*تم إنشاء هذا التقرير بدمج تحليل شيفرة مصدرية (Static Analysis) مع تقرير PDF مرجعي.*
