-- İlanlar tablosuna ödeme yöntemleri ve etiketler (tags) sütunlarını ekler.
-- Bu scripti Supabase Dashboard > SQL Editor kısmında çalıştırın.

ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags            TEXT[] DEFAULT '{}';
