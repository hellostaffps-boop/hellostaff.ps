# دليل التنفيذ خطوة بخطوة — Hello Staff Security
**تاريخ:** 2026-04-27  
**المنصة:** Supabase + Vite + staffps.com  
**الغرض:** تنفيذ جميع الإصلاحات الأمنية في بيئة الإنتاج

---

## المتطلبات المسبقة

قبل البدء، تأكد من:
1. حساب Supabase مفعل مع مشروع Hello Staff
2. CLI مثبت: `npm install -g supabase`
3. Node.js 20+ مثبت
4. حق الوصول للـ GitHub repo (إذا استخدمت Vercel/Netlify)

---

## الخطوة 1: إيجاد Project Ref الخاص بك

### أين تجده:

1. افتح [supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروع Hello Staff
3. انظر إلى URL المتصفح:
```
https://supabase.com/dashboard/project/XXXXXXXXXXXX
                                    ↑↑↑↑↑↑↑↑↑↑↑↑
                                    هذا هو Project Ref
```

أو انظر في **Project Settings → General → Reference ID**

```
📋 انسخ هذا المعرف: abcdefghijklmnopqrst
```

---

## الخطوة 2: تسجيل الدخول وربط CLI بالمشروع

افتح Terminal (CMD/PowerShell على Windows, Terminal على Mac/Linux):

```bash
# 1. تسجيل الدخول لـ Supabase
supabase login

# سيفتح المتصفح اطلب منك الموافقة
# بعدها سيظهر: "You are now logged in!"

# 2. انتقل لمجلد المشروع
cd /path/to/hellostaff.ps

# 3. ربط CLI بالمشروع
supabase link --project-ref YOUR_PROJECT_REF

# مثال فعلي:
supabase link --project-ref abcdefghijklmnopqrst
```

**النتيجة:** `Linked to project: abcdefghijklmnopqrst`

---

## الخطوة 3: تشغيل ملف SQL في Supabase

### 3.1 فتح SQL Editor

1. في لوحة تحكم Supabase، اذهب إلى: **Database → SQL Editor**
2. اضغط **New Query**
3. انسخ وألصق محتوى ملف `hellostaff_security_patch.sql` بالكامل

### 3.2 تشغيل الاستعلام

اضغط **Run** (أو Ctrl+Enter / Cmd+Enter)

### 3.3 التحقق من النجاح

افتح **New Query** جديد وشغّل:
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**يجب أن ترى 60+ صف (policies)** إذا كانت كل الجداول موجودة.

### 3.4 التحقق من Functions

```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('broadcast_notification_secure', 'seed_demo_data', 'clear_demo_data', 'assert_platform_admin')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**يجب أن ترى 4 functions** وكلها `prosecdef = t` (SECURITY DEFINER)

---

## الخطوة 4: ضبط Secrets للـ Edge Functions

### 4.1 إنشاء ملف .env

أنشئ ملف جديد في مجلد المشروع (ليس `src/`) باسم `.env`:

```env
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:support@staffps.com
ALLOWED_ORIGIN=https://www.staffps.com,https://staffps.com
SUPER_ADMIN_EMAIL=admin@staffps.com
```

### 4.2 إنشاء VAPID Keys (إذا لم تكن لديك)

```bash
npx web-push generate-vapid-keys
```

**النتيجة:**
```
=======================================
Public Key:
BEfDH9JxK_6JHOJYrF9mij6IGdK9PND-JwN4vr3Jn2-YOetDpWq603Ai2_3zHbsT9EUE1pZaIVnuZL-vv4MbODs

Private Key:
your-private-key-here

=======================================
```

انسخها إلى ملف `.env`

### 4.3 رفع Secrets للمشروع

```bash
cd /path/to/hellostaff.ps

# رفع كل Secrets من ملف .env
supabase secrets set --env-file .env --project-ref YOUR_PROJECT_REF

# أو رفعها واحدة واحدة:
supabase secrets set VAPID_PUBLIC_KEY="BEfDH9..." --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_PRIVATE_KEY="your-private..." --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_SUBJECT="mailto:support@staffps.com" --project-ref YOUR_PROJECT_REF
supabase secrets set ALLOWED_ORIGIN="https://www.staffps.com,https://staffps.com" --project-ref YOUR_PROJECT_REF
supabase secrets set SUPER_ADMIN_EMAIL="admin@staffps.com" --project-ref YOUR_PROJECT_REF
```

### 4.4 التحقق

```bash
supabase secrets list --project-ref YOUR_PROJECT_REF
```

**يجب أن ترى:**
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT
- ALLOWED_ORIGIN
- SUPER_ADMIN_EMAIL

---

## الخطوة 5: نشر Edge Functions

### 5.1 نشر send-push

```bash
cd /path/to/hellostaff.ps

supabase functions deploy send-push --project-ref YOUR_PROJECT_REF
```

**النتيجة:**
```
Deployed send-push to https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push
```

### 5.2 التحقق من النشر

```bash
# اختبار الـ Function
supabase functions serve send-push
# أو:
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

**YOUR_ANON_KEY** موجود في: **Project Settings → API → Project API keys → anon public**

---

## الخطوة 6: إعداد Supabase Auth URL Configuration

### 6.1 Site URL

1. في لوحة تحكم Supabase: **Authentication → URL Configuration**
2. في حقل **Site URL**:
```
https://www.staffps.com
```
3. اضغط **Save**

### 6.2 Redirect URLs (Additional Redirect URLs)

في نفس الصفحة، أضف:
```
https://www.staffps.com/auth/callback
https://www.staffps.com/auth/reset-password
https://staffps.com/auth/callback
https://staffps.com/auth/reset-password
```

**ملاحظة:** يمكنك استخدام wildcard لتبسيط:
```
https://www.staffps.com/**
https://staffps.com/**
```

### 6.3 Email Templates (مهم!)

1. اذهب إلى: **Authentication → Email Templates**
2. افتح **Confirm signup**
3. تأكد أن الرابط يستخدم `{{ .RedirectTo }}`:
```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your mail</a>
```
4. افتح **Reset password**
5. تأكد من نفس الشيء:
```html
<a href="{{ .RedirectTo }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

---

## الخطوة 7: إنشاء حساب Super Admin

### 7.1 التسجيل العادي

1. افتح موقعك: `https://www.staffps.com/auth/signup`
2. سجّل بإيميل `admin@staffps.com` (أو أي إيميل حددته في `SUPER_ADMIN_EMAIL`)
3. أكد الإيميل عبر الرابط الذي سيصلك
4. سجّل دخول

### 7.2 ترقية الحساب إلى Admin

بعد تسجيل الدخول:

1. افتح DevTools (F12)
2. اذهب إلى **Console**
3. شغّل:
```javascript
fetch('/functions/v1/bootstrapAdminAccess', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Admin access granted"
}
```

### 7.3 التحقق

1. أعد تحميل الصفحة
2. جرب الدخول لـ `/admin`
3. يجب أن يعمل

---

## الخطوة 8: بناء ونشر Frontend

### 8.1 إنشاء ملف بيئة الإنتاج

أنشئ `.env.production` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8.2 تثبيت DOMPurify (اختياري لكن موصى)

```bash
cd /path/to/hellostaff.ps
npm install isomorphic-dompurify
```

### 8.3 البناء

```bash
npm install
npm run build
```

**النتيجة:** مجلد `dist/` يحتوي على الملفات الجاهزة للنشر

### 8.4 النشر

#### إذا استخدمت Vercel:

```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. نشر
vercel --prod
```

أو عبر GitHub:
1. ارفع الكود لـ GitHub
2. اربط Repo بـ Vercel Dashboard
3. فعل Auto-deploy

#### إذا استخدمت Netlify:

```bash
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```

#### إذا استخدمت Firebase Hosting:

```bash
npm install -g firebase-tools
firebase deploy --only hosting
```

#### إذا استخدمت VPS (DigitalOcean/EC2/...):

```bash
# 1. نسخ dist/ للخادم
scp -r dist/ root@your-server-ip:/var/www/staffps.com/

# 2. إعداد Nginx (إذا لم يكن معداً)
# في /etc/nginx/sites-available/staffps.com:
server {
    listen 80;
    server_name staffps.com www.staffps.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staffps.com www.staffps.com;
    
    root /var/www/staffps.com/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/staffps.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staffps.com/privkey.pem;
}
```

---

## الخطوة 9: اختبار الأمان (QA Checklist)

### 9.1 اختبار RLS

```sql
-- في Supabase SQL Editor
SELECT 
  tablename, 
  COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY policy_count DESC;
```

**يجب أن ترى كل الجداول مع policy_count >= 1**

### 9.2 اختبار Admin Escalation (يجب أن يفشل)

1. سجّل دخول بحساب عادي (ليست admin)
2. افتح Console (F12)
3. شغّل:
```javascript
const { error } = await supabase.rpc('seed_demo_data');
console.log(error.message);
```
**يجب أن يظهر:** `"FORBIDDEN: platform_admin role required"`

### 9.3 اختبار حذف وظيفة لا تملكها

```javascript
// سجّل دخول كـ candidate (باحث عن عمل)
// جرب حذف وظيفة:
await supabase.from('jobs').delete().eq('id', '00000000-0000-0000-0000-000000000000');
// يجب أن يرجع: { status: 200, data: null }
// ولكن لا شيء يُحذف فعلياً (RLS يمنع)
```

### 9.4 اختبار XSS Sanitization

1. افتح صفحة Terms أو Privacy
2. افتح DevTools → Elements
3. ابحث عن `<script>` — يجب ألا تجد أي script tag حقيقي

### 9.5 اختبار CORS

```bash
curl -i -X OPTIONS \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push \
  -H "Origin: https://evil.com"
```

**يجب أن يرجع خطأ أو Origin غير مطابق**

---

## الخطوة 10: تنظيف الملفات غير المستخدمة

### 10.1 حذف ملف فارغ

```bash
cd /path/to/hellostaff.ps
rm src/lib/adminServiceExtensions.js
```

### 10.2 إعادة تسمية ملف باسم غريب

```bash
mv "src/components/NotificationDrawer.jsx旋" src/components/NotificationDrawer.jsx
```

### 10.3 تحديث الإيميلات (تم ✅ في الكود)

الإيميلات المحدّثة:
- `hello@staffps.com`
- `privacy@staffps.com`
- `legal@staffps.com`

---

## ملاحظات نهائية

### ماذا إذا واجهت مشاكل؟

| المشكلة | الحل |
|---------|------|
| `Error: Project not found` | تأكد من `YOUR_PROJECT_REF` الصحيح |
| `Error: unauthorized` | شغّل `supabase login` من جديد |
| `SQL Error: relation does not exist` | لا تقلق — الملف يتخطى الجداول المفقودة تلقائياً |
| `Edge Function deployment failed` | تأكد أن الدالة لا تحتوي على syntax errors |
| `CORS error in browser` | تأكد من `ALLOWED_ORIGIN` في secrets |

### التحقق الدوري

بعد الإنتشار، راقب:
1. **Supabase Logs**: Dashboard → Edge Functions → Logs
2. **Audit Logs**: جدول `audit_logs` (إذا أضفت records)
3. **RLS Status**: شغّل SQL check أسبوعياً

### الاتصال في حالات الطوارئ

إذا فُقدت صلاحية Admin:
```sql
-- في Supabase SQL Editor (بصفة postgres owner)
UPDATE public.profiles SET role = 'platform_admin' WHERE email = 'admin@staffps.com';
```
