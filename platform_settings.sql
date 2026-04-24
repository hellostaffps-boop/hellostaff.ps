-- جدول إعدادات المنصة
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  primary_color TEXT DEFAULT '222 47% 18%', -- HSL format for Tailwind
  accent_color TEXT DEFAULT '38 92% 50%',
  font_family TEXT DEFAULT 'Inter',
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- السماح بصف واحد فقط (Singleton) عن طريق تقييد الـ ID
ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);

-- إدخال القيم الافتراضية
INSERT INTO platform_settings (id, primary_color, accent_color, font_family)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '222 47% 18%', '38 92% 50%', 'Inter')
ON CONFLICT (id) DO NOTHING;

-- إعداد صلاحيات RLS (السماح للجميع بالقراءة، والمنصة بالمسح/التعديل عبر الدومين أو المشرفين)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to platform_settings"
ON platform_settings FOR SELECT
USING (true);

CREATE POLICY "Allow admin to update platform_settings"
ON platform_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN profiles ON profiles.id = auth.users.id
    WHERE auth.uid() = profiles.id AND profiles.role = 'platform_admin'
  )
);
