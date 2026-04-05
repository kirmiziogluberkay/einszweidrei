# Einszweidrei — Geliştirici Kurulum Kılavuzu

## 1. Bağımlılıkları Kur

```bash
npm install
```

## 2. Ortam Değişkenlerini Ayarla

`.env.local.example` dosyasını kopyalayın:

```bash
cp .env.local.example .env.local
```

`.env.local` içindeki değerleri doldurun:

```
NEXT_PUBLIC_SUPABASE_URL=https://mzpapilwofbcaqotdxgu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase key'lerini **Project Settings → API** bölümünden bulabilirsiniz.

## 3. Supabase Veritabanını Kur

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz → **SQL Editor**
2. `supabase/schema.sql` dosyasının içeriğini yapıştırın
3. "Run" düğmesine tıklayın

Bu script tek seferde şunları oluşturur:
- Tablolar (profiles, categories, ads, messages)
- Trigger'lar (seri numarası, otomatik profil, updated_at)
- RLS politikaları
- Storage bucket (ad-images)
- Başlangıç kategorileri

## 4. İlk Admin Kullanıcısını Oluştur

Kayıt olduktan sonra SQL Editor'de:

```sql
UPDATE profiles
SET role = 'admin'
WHERE username = 'KULLANICI_ADINIZ';
```

## 5. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

## 6. Deploy (Vercel)

```bash
npm run build   # Üretim build
```

Vercel'e deploy ederken `.env.local` değişkenlerini
Vercel Dashboard → Environment Variables bölümüne ekleyin.

---

## Proje Yapısı

```
app/                    Sayfalar (Next.js App Router)
  page.js               Ana sayfa
  ilan/[seriNo]/        İlan detay ve düzenleme
  ilan-ver/             Yeni ilan oluştur
  profilim/             Kullanıcı profili
  mesajlar/             Mesaj kutusu
  ara/                  Arama sayfası
  kategori/[slug]/      Kategori sayfası
  admin/                Admin paneli
  (auth)/               Login & Register
components/             Yeniden kullanılabilir bileşenler
constants/config.js     Tüm sabit ayarlar (buradan başlayın!)
lib/                    Yardımcı fonksiyonlar & Supabase istemcileri
hooks/                  Custom React hook'lar
supabase/schema.sql     Veritabanı kurulum scripti
middleware.js           Auth & RBAC koruma
```

## Özelleştirme

**Site adını, kategorileri, fiyat formatını** değiştirmek için
`constants/config.js` dosyasını düzenleyin — bu dosya tüm
yapılandırmayı tek bir yerde toplar.
