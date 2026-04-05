-- =======================================================
-- Einszweidrei — Supabase Veritabanı Kurulum Scripti
-- =======================================================
-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştırın.
-- Sırayla çalıştırın: tabloları → trigger'ları → RLS → seed
-- =======================================================


-- ──────────────────────────────────────────────────────────
-- 1. TABLOLAR
-- ──────────────────────────────────────────────────────────

-- Kullanıcı profilleri (Supabase Auth ile ilişkili)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        UNIQUE NOT NULL,
  role        TEXT        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Hiyerarşik kategoriler
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  parent_id   UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- İlanlar
CREATE TABLE IF NOT EXISTS public.ads (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number  TEXT           UNIQUE NOT NULL DEFAULT '',
  title          TEXT           NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2),
  currency       TEXT           DEFAULT 'TRY',
  images         TEXT[]         DEFAULT '{}',
  owner_id       UUID           REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id    UUID           REFERENCES public.categories(id) ON DELETE SET NULL,
  status         TEXT           DEFAULT 'active' CHECK (status IN ('active', 'passive', 'sold')),
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- Mesajlar
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  ad_id        UUID        REFERENCES public.ads(id) ON DELETE CASCADE,
  is_read      BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────
-- 2. FONKSİYONLAR & TRIGGER'LAR
-- ──────────────────────────────────────────────────────────

-- Benzersiz seri numarası üreten fonksiyon (8 karakter alfanümerik)
CREATE OR REPLACE FUNCTION generate_serial_number()
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i      INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- İlan eklendiğinde seri numarası atayan trigger fonksiyonu
CREATE OR REPLACE FUNCTION set_serial_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Boş seri numarasını doldur, çakışma yoksa devam et
  IF NEW.serial_number IS NULL OR NEW.serial_number = '' THEN
    LOOP
      NEW.serial_number := generate_serial_number();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.ads WHERE serial_number = NEW.serial_number);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: INSERT öncesinde çalış
DROP TRIGGER IF EXISTS ads_serial_number_trigger ON public.ads;
CREATE TRIGGER ads_serial_number_trigger
BEFORE INSERT ON public.ads
FOR EACH ROW EXECUTE FUNCTION set_serial_number();

-- Profil otomatik oluşturma: Auth kaydı sonrası
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ads_updated_at ON public.ads;
CREATE TRIGGER ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- Categories (sadece admin yazabilir)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "categories_admin_write"
  ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- Ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Herkes aktif ilanları görebilir
CREATE POLICY "ads_select_active"
  ON public.ads FOR SELECT USING (status = 'active');

-- Admin tüm ilanları görebilir
CREATE POLICY "ads_select_admin"
  ON public.ads FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Kullanıcı kendi ilanlarını yönetir
CREATE POLICY "ads_owner_all"
  ON public.ads FOR ALL USING (auth.uid() = owner_id);

-- Admin tüm ilanları yönetir
CREATE POLICY "ads_admin_all"
  ON public.ads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi mesajlarını görür
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Kullanıcı mesaj gönderebilir
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Kullanıcı kendi mesajını silebilir
CREATE POLICY "messages_delete_own"
  ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- Admin tüm mesajları görür ve silebilir
CREATE POLICY "messages_admin_all"
  ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ──────────────────────────────────────────────────────────
-- 4. SUPABASE STORAGE
-- ──────────────────────────────────────────────────────────
-- Bu kısmı Supabase Dashboard > Storage > New Bucket ile
-- veya aşağıdaki SQL ile yapın:

INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT DO NOTHING;

-- Herkes okuyabilir (public bucket)
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');

-- Giriş yapmış kullanıcı yükleyebilir
CREATE POLICY "storage_auth_upload"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ad-images' AND auth.role() = 'authenticated'
  );

-- Kullanıcı kendi yüklediği dosyayı silebilir
CREATE POLICY "storage_owner_delete"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'ad-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ──────────────────────────────────────────────────────────
-- 5. BAŞLANGIÇ KATEGORİLERİ (SEED)
-- ──────────────────────────────────────────────────────────

-- Ana kategoriler
INSERT INTO public.categories (name, slug, parent_id, sort_order)
VALUES
  ('İkinci El Eşya', 'ikinci-el-esya', NULL, 1),
  ('Kiralık Eşya',   'kiralik-esya',   NULL, 2)
ON CONFLICT (slug) DO NOTHING;

-- İkinci El alt kategorileri
INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT
  sub.name,
  sub.slug,
  (SELECT id FROM public.categories WHERE slug = 'ikinci-el-esya'),
  sub.ord
FROM (VALUES
  ('Elektronik',       'ikinci-el-elektronik', 1),
  ('Mobilya',          'ikinci-el-mobilya',    2),
  ('Giyim & Aksesuar', 'ikinci-el-giyim',      3),
  ('Spor & Outdoor',   'ikinci-el-spor',       4),
  ('Kitap & Hobi',     'ikinci-el-kitap',      5),
  ('Diğer',            'ikinci-el-diger',      6)
) AS sub(name, slug, ord)
ON CONFLICT (slug) DO NOTHING;

-- Kiralık alt kategorileri
INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT
  sub.name,
  sub.slug,
  (SELECT id FROM public.categories WHERE slug = 'kiralik-esya'),
  sub.ord
FROM (VALUES
  ('Elektronik',     'kiralik-elektronik', 1),
  ('Kamp & Outdoor', 'kiralik-kamp',       2),
  ('Araç & Gereç',   'kiralik-arac',       3),
  ('Diğer',          'kiralik-diger',      4)
) AS sub(name, slug, ord)
ON CONFLICT (slug) DO NOTHING;
