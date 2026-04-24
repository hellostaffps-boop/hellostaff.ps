-- ============================================================
-- Hello Staff Pro — Phase 7 SQL: Academy, Store & Orders
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. ACADEMY COURSES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'barista', -- barista, chef, management, service
  target_audience TEXT DEFAULT 'all', -- workers, employers, all
  instructor_name TEXT,
  instructor_name_ar TEXT,
  duration TEXT, -- e.g. "2 hours", "4 weeks"
  video_url TEXT,
  pdf_url TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses" ON public.academy_courses 
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage courses" ON public.academy_courses
  USING (public.get_user_role() = 'platform_admin');

-- ─────────────────────────────────────────────
-- 2. STORE PRODUCTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'digital', -- digital, physical
  sub_category TEXT, -- barista, chef, equipment, books
  target_audience TEXT DEFAULT 'all', -- workers, employers, all
  media_url TEXT, -- product image
  file_url TEXT, -- for digital downloads
  is_published BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT -1, -- -1 means unlimited (digital)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products" ON public.store_products 
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage products" ON public.store_products
  USING (public.get_user_role() = 'platform_admin');

-- ─────────────────────────────────────────────
-- 3. STORE ORDERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
  payment_method TEXT DEFAULT 'cash_on_delivery', -- cash_on_delivery, card, subscription
  shipping_address TEXT,
  phone_number TEXT,
  digital_released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.store_orders 
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can create orders" ON public.store_orders 
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Admins can view all orders" ON public.store_orders 
  FOR SELECT USING (public.get_user_role() = 'platform_admin');

CREATE POLICY "Admins can update orders" ON public.store_orders 
  FOR UPDATE USING (public.get_user_role() = 'platform_admin');

-- ─────────────────────────────────────────────
-- 4. STORE ORDER ITEMS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.store_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.store_order_items 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.store_orders WHERE id = store_order_items.order_id AND user_email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can insert order items" ON public.store_order_items 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.store_orders WHERE id = store_order_items.order_id AND user_email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can view all order items" ON public.store_order_items 
  FOR SELECT USING (public.get_user_role() = 'platform_admin');


-- ─────────────────────────────────────────────
-- 5. DEMO DATA (Focus on Barista & Coffee)
-- ─────────────────────────────────────────────

-- Insert Demo Courses
INSERT INTO public.academy_courses (title, title_ar, description, description_ar, category, instructor_name, instructor_name_ar, duration, is_published, thumbnail_url, video_url)
VALUES 
('Latte Art Masterclass', 'احتراف فن اللاتيه (اللاتيه آرت)', 'Learn the fundamentals of milk texturing and pouring basic to advanced latte art patterns.', 'تعلم أساسيات تبخير الحليب ورسم الأشكال الفنية المعقدة والبسيطة في اللاتيه.', 'barista', 'Ahmed CoffeeMaster', 'أحمد خبير القهوة', '3 hours', true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Espresso Extraction Science', 'علم استخلاص الاسبريسو', 'Deep dive into variables affecting espresso extraction: dose, yield, time, and temperature.', 'تعمق في المتغيرات التي تؤثر على استخلاص الاسبريسو: الكمية، الاستخراج، الوقت، والحرارة.', 'barista', 'Sarah Beans', 'سارة بينز', '2.5 hours', true, 'https://images.unsplash.com/photo-1510227272981-87123e259b17?w=800&q=80', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Menu Development for Cafes', 'تطوير قوائم الطعام للمقاهي', 'How to design a profitable and attractive menu for your cafe.', 'كيفية تصميم قائمة طعام جذابة ومربحة لمقهاك الخاص.', 'management', 'Chef Omar', 'الشيف عمر', '4 hours', true, 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80', 'https://www.youtube.com/embed/dQw4w9WgXcQ');

-- Insert Demo Products
INSERT INTO public.store_products (title, title_ar, description, description_ar, price, category, sub_category, target_audience, media_url, file_url, is_published)
VALUES
('Professional Barista Guide (PDF)', 'الدليل الاحترافي للباريستا (PDF)', 'Comprehensive 100-page guide covering coffee origins, roasting, and brewing techniques.', 'دليل شامل من 100 صفحة يغطي أصول القهوة وتحميصها وطرق تحضيرها.', 15.00, 'digital', 'barista', 'workers', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80', '#', true),
('Cafe Management Template Bundle', 'حزمة قوالب إدارة المقاهي', 'Excel templates for inventory, staff scheduling, and profit calculation.', 'قوالب إكسل لإدارة المخزون، جدولة الموظفين، وحساب الأرباح.', 49.99, 'digital', 'management', 'employers', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', '#', true),
('Coffee Cupping Spoon (Pro)', 'ملعقة تذوق القهوة الاحترافية', 'High-quality stainless steel cupping spoon for professional baristas.', 'ملعقة تذوق قهوة احترافية من الستانلس ستيل عالي الجودة.', 12.50, 'physical', 'equipment', 'all', 'https://images.unsplash.com/photo-1521369909029-2afed8822786?w=800&q=80', NULL, true);
