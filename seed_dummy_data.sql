-- ============================================================
-- Hello Staff Pro — Seed Data (News & Top Organizations)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Insert Top Organization (Senses Roastery)
INSERT INTO public.organizations (
  owner_email,
  name,
  business_type,
  city,
  address,
  logo_url,
  cover_image_url,
  description,
  verified,
  status
)
VALUES (
  'info@sensesroastery.com',
  'محمصة سينسيس للقهوة المختصة',
  'cafe',
  'رام الله',
  'الماصيون، رام الله',
  'https://images.unsplash.com/photo-1559925393-8be0a33e2a14?w=500&q=80',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1000&q=80',
  'أول محمصة للقهوة المختصة في فلسطين. نقدم أفضل أنواع حبوب القهوة المستوردة بدقة عالية لضمان تجربة لا تنسى لعشاق القهوة.',
  true,
  'active'
) ON CONFLICT DO NOTHING;

-- 2. Insert Dummy Organizations (More Cafe/Restaurants)
INSERT INTO public.organizations (
  owner_email,
  name,
  business_type,
  city,
  description,
  verified,
  status
)
VALUES 
('contact@arabica.ps', 'قهوة أرابيكا', 'cafe', 'نابلس', 'مقهى محلي يقدم أفضل الحلويات والقهوة.', true, 'active'),
('manger@levantine.ps', 'مطعم الشام', 'restaurant', 'بيت لحم', 'أصالة المطبخ الشامي.', true, 'active')
ON CONFLICT DO NOTHING;

-- 3. Insert News Articles
INSERT INTO public.news_articles (
  title,
  title_ar,
  slug,
  excerpt,
  excerpt_ar,
  content,
  content_ar,
  image_url,
  category,
  status
)
VALUES (
  'Senses Roastery: Revolutionizing Coffee in Palestine',
  'محمصة سينسيس تسجل ابتكاراً جديداً كأول محمصة مختصة في فلسطين',
  'senses-roastery-leading-coffee-palestine',
  'A deep dive into how Senses Roastery is changing the local coffee culture.',
  'تعرف على رحلة محمصة سينسيس وكيف استطاعت إحداث ثورة في ثقافة القهوة المختصة في رام الله وفلسطين.',
  'Senses Roastery in Ramallah has recently been recognized as the first specialty coffee roastery of its kind in Palestine. They offer unique blends and a premium experience. This achievement sets a new standard for hospitality standards...',
  'تُعتبر محمصة سينسيس في رام الله أول محمصة متخصصة في القهوة في فلسطين، حيث تقدم تجارب فريدة وحبوب قهوة مختارة بعناية. هذا الإنجاز لا يعزز فقط ثقافة القهوة المحلية، بل يشجع أيضاً المنشآت الأخرى على رفع مستوى الضيافة.',
  '/images/senses-roastery.jpg',
  'industry_news',
  'published'
),
(
  'Top 5 Must-Have Skills for Baristas in 2026',
  'أهم 5 مهارات يحتاجها الباريستا في عام 2026',
  'top-barista-skills-2026',
  'Discover the skills that will get you hired instantly in top cafes.',
  'استكشف المهارات الأساسية التي ستجعل أصحاب العمل يتسابقون لتوظيفك.',
  'The demand for artisan coffee is rising. Being a barist today requires more than just making coffee. Customer service, latte art, and machinery maintenance are top priorities...',
  'زاد الطلب على القهوة المختصة بشكل كبير. أن تكون صانع قهوة اليوم يتطلب أكثر من مجرد تحضير القهوة؛ خدمة العملاء، فن اللاتيه (Latte Art)، وصيانة الآلات أصبحت من الأولويات المطلوبة.',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1000&q=80',
  'career_tips',
  'published'
),
(
  'How Hello Staff is Changing Hospitality Hiring',
  'كيف تُغير هيلو ستاف آليات التوظيف في قطاع الضيافة',
  'hello-staff-changing-hospitality-hiring',
  'A new platform connects talents with premium cafes and restaurants effortlessly.',
  'منصة جديدة تتيح اتصالاً سريعاً بين المواهب والمطاعم الفاخرة بكل سهولة.',
  'Finding the right staff has always been a struggle. Hello Staff brings a cinematic and highly efficient digital platform to connect candidates with opportunities...',
  'لطالما كان إيجاد الكفاءات أمراً صعباً. تقدم منصة هيلو ستاف حلاً رقمياً غير مسبوق في المنطقة يجمع بين سهولة الاستخدام، التصميم الجذاب، والفعالية في الجمع بين أصحاب العمل والباحثين عن الفرص المميزة.',
  'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1000&q=80',
  'platform_updates',
  'published'
);
