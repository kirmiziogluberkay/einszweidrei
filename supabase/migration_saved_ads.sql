-- =======================================================
-- Migration: saved_ads tablosu
-- Kullanıcıların ilanları kaydetmesini/takip etmesini sağlar
-- =======================================================

CREATE TABLE IF NOT EXISTS public.saved_ads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_id      UUID        NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi kayıtlarını görebilir
CREATE POLICY "saved_ads_select_own"
  ON public.saved_ads FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcı ilan kaydedebilir
CREATE POLICY "saved_ads_insert_own"
  ON public.saved_ads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcı kendi kaydını silebilir
CREATE POLICY "saved_ads_delete_own"
  ON public.saved_ads FOR DELETE USING (auth.uid() = user_id);
