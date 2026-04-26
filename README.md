# Hello Staff — Security Fixes Package
**تاريخ:** 2026-04-27

---

## ما يحتويه هذا المجلد

| الملف | المسار الأصلي في مشروعك | الغرض |
|-------|------------------------|-------|
| **src/lib/supabaseClient.js** | `src/lib/supabaseClient.js` | إزالة fallback الخطير |
| **src/lib/adminService.js** | `src/lib/adminService.js` | assertAdmin ثنائي الطبقة |
| **src/lib/services/jobService.js** | `src/lib/services/jobService.js` | حماية deleteJob/updateJob |
| **src/lib/services/applicationService.js** | `src/lib/services/applicationService.js` | حماية التطبيقات والرسائل |
| **src/lib/services/notificationService.js** | `src/lib/services/notificationService.js` | حماية الإشعارات |
| **src/lib/storeService.js** | `src/lib/storeService.js` | التحقق من الأسعار |
| **src/lib/storageService.js** | `src/lib/storageService.js` | whitelist للـ MIME |
| **src/lib/demoData.js** | `src/lib/demoData.js` | إزالة localStorage demo |
| **src/lib/sanitizeHtml.js** | `src/lib/sanitizeHtml.js` | مُطهر XSS (جديد) |
| **src/pages/Contact.jsx** | `src/pages/Contact.jsx` | تحديث الإيميل |
| **src/pages/PrivacyPolicy.jsx** | `src/pages/PrivacyPolicy.jsx` | تحديث الإيميل |
| **src/pages/TermsOfService.jsx** | `src/pages/TermsOfService.jsx` | تحديث الإيميل |
| **src/App.jsx** | `src/App.jsx` | إصلاح AdminNotifications |
| **src/SECURITY_NOTES.md** | `src/SECURITY_NOTES.md` | توثيق أمني محدّث |
| **src/ADMIN_SECURITY.md** | `src/ADMIN_SECURITY.md` | دليل الإدارة |
| **supabase/functions/send-push/index.ts** | `supabase/functions/send-push/index.ts` | Edge Function محمي |
| **base44/functions/bootstrapAdminAccess/entry.ts** | `base44/functions/bootstrapAdminAccess/entry.ts` | Super Admin check |
| **base44/functions/getAdminAccessState/entry.ts** | `base44/functions/getAdminAccessState/entry.ts` | Timing-safe token |
| **hellostaff_security_patch.sql** | (جذر المشروع أو في Supabase) | RLS + RPC fixes |
| **hellostaff_security_report.md** | (مجلد docs/) | التقرير الأمني |
| **IMPLEMENTATION_GUIDE.md** | (مجلد docs/) | دليل التنفيذ |

---

## كيفية التطبيق

### الطريقة السريعة (موصى بها)

1. افتح Terminal في مجلد مشروعك:
```bash
cd /path/to/hellostaff.ps
```

2. أنسخ الملفات:
```bash
# على Linux/Mac:
cp -r /path/to/hellostaff-security-fixes/src/* src/
cp -r /path/to/hellostaff-security-fixes/supabase/functions/* supabase/functions/
cp -r /path/to/hellostaff-security-fixes/base44/functions/* base44/functions/
cp /path/to/hellostaff-security-fixes/hellostaff_security_patch.sql .
```

أو على Windows (PowerShell):
```powershell
Copy-Item -Path "C:\Users\YourName\Downloads\hellostaff-security-fixes\src\*" -Destination "src\" -Recurse -Force
Copy-Item -Path "C:\Users\YourName\Downloads\hellostaff-security-fixes\supabase\functions\*" -Destination "supabase\functions\" -Recurse -Force
Copy-Item -Path "C:\Users\YourName\Downloads\hellostaff-security-fixes\base44\functions\*" -Destination "base44\functions\" -Recurse -Force
Copy-Item "C:\Users\YourName\Downloads\hellostaff-security-fixes\hellostaff_security_patch.sql" -Destination "."
```

3. ثبّت DOMPurify (اختياري):
```bash
npm install isomorphic-dompurify
```

4. ارفع الكود:
```bash
git add .
git commit -m "Security hardening: RLS, XSS, admin auth, edge functions"
git push origin main
```

5. Vercel ينشر تلقائياً.

6. شغّل ملف SQL في Supabase:
   - افتح [supabase.com/dashboard](https://supabase.com/dashboard)
   - Database → SQL Editor → New Query
   - انسخ محتوى `hellostaff_security_patch.sql`
   - اضغط Run

---

## التحقق من النجاح

```sql
-- في Supabase SQL Editor
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- يجب أن يرجع 60+ (إذا كانت كل الجداول موجودة)
```

```bash
# في Terminal
supabase functions list --project-ref YOUR_PROJECT_REF
# يجب أن يظهر: send-push
```

```bash
# في Terminal
supabase secrets list --project-ref YOUR_PROJECT_REF
# يجب أن يظهر: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, ALLOWED_ORIGIN, SUPER_ADMIN_EMAIL
```
