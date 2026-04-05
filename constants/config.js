/**
 * constants/config.js
 * =====================================================
 * Uygulamanın tüm sabit ayarları ve yapılandırması.
 * İleride değiştirilmesi muhtemel tüm metinler ve
 * değerler buradan yönetilir.
 * =====================================================
 */

// ─── Site Genel Bilgileri ─────────────────────────────────────────────────────

/** Tarayıcı sekmesinde ve SEO için kullanılan site adı */
export const SITE_NAME = 'Einszweidrei';

/** Site açıklaması (meta description) */
export const SITE_DESCRIPTION =
  'İkinci el eşya al-sat ve kiralık eşya ilanları platformu. Güvenli, kolay ve hızlı.';

/** Anasayfada hero bölümünde gösterilen slogan */
export const SITE_TAGLINE = 'İkinci El & Kiralık Eşya Platformu';

/** Geliştirici / şirket adı */
export const SITE_AUTHOR = 'Einszweidrei';

// ─── URL Yapılandırması ───────────────────────────────────────────────────────

/** Üretim ortamındaki site URL'i (Vercel'e deploy sonrası güncelle) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** İlan detay sayfası URL öneki */
export const AD_URL_PREFIX = '/ilan';

// ─── Sayfalama ────────────────────────────────────────────────────────────────

/** Ana sayfada tek seferde kaç ilan gösterilir */
export const ADS_PER_PAGE = 12;

/** Admin panelinde tek seferde kaç kayıt gösterilir */
export const ADMIN_ITEMS_PER_PAGE = 20;

// ─── Fotoğraf Yükleme ─────────────────────────────────────────────────────────

/** Supabase Storage bucket adı */
export const STORAGE_BUCKET = 'ad-images';

/** Bir ilana yüklenebilecek maksimum fotoğraf sayısı */
export const MAX_IMAGES_PER_AD = 6;

/** Tek bir fotoğrafın maksimum boyutu (byte) — 5 MB */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** İzin verilen dosya formatları */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Para Birimi ──────────────────────────────────────────────────────────────

/** Varsayılan para birimi kodu */
export const DEFAULT_CURRENCY = 'TRY';

/** Para birimi sembolü */
export const CURRENCY_SYMBOL = '₺';

/** Fiyat formatı için locale */
export const PRICE_LOCALE = 'tr-TR';

// ─── İlan Durumları ───────────────────────────────────────────────────────────

/** Mevcut ilan durumları ve etiketleri */
export const AD_STATUSES = {
  active:  { label: 'Aktif',  color: 'green' },
  passive: { label: 'Pasif',  color: 'gray'  },
  sold:    { label: 'Satıldı', color: 'red'  },
};

// ─── Kullanıcı Rolleri ────────────────────────────────────────────────────────

/** Uygulama genelinde tanımlı roller */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER:  'user',
};

// ─── Auth. Güvenlik ───────────────────────────────────────────────────────────

/** Admin paneline erişim için gereken rol */
export const ADMIN_REQUIRED_ROLE = USER_ROLES.ADMIN;

/** Giriş yapılmadan erişilemeyen rotalar (middleware içinde kullanılır) */
export const PROTECTED_ROUTES = [
  '/ilan-ver',
  '/profilim',
  '/mesajlar',
  '/admin',
];

/** Admin panelinin URL öneki */
export const ADMIN_ROUTE_PREFIX = '/admin';

// ─── Başlangıç Kategorileri ───────────────────────────────────────────────────
/**
 * Veritabanı boşken seed için kullanılır.
 * Admin panelinden dinamik olarak yönetilebilir.
 */
export const DEFAULT_CATEGORIES = [
  {
    name:      'İkinci El Eşya',
    slug:      'ikinci-el-esya',
    parent_id: null,
    children:  [
      { name: 'Elektronik',       slug: 'ikinci-el-elektronik' },
      { name: 'Mobilya',          slug: 'ikinci-el-mobilya'    },
      { name: 'Giyim & Aksesuar', slug: 'ikinci-el-giyim'      },
      { name: 'Spor & Outdoor',   slug: 'ikinci-el-spor'       },
      { name: 'Kitap & Hobi',     slug: 'ikinci-el-kitap'      },
      { name: 'Diğer',            slug: 'ikinci-el-diger'      },
    ],
  },
  {
    name:      'Kiralık Eşya',
    slug:      'kiralik-esya',
    parent_id: null,
    children:  [
      { name: 'Elektronik',    slug: 'kiralik-elektronik' },
      { name: 'Kamp & Outdoor', slug: 'kiralik-kamp'      },
      { name: 'Araç & Gereç',  slug: 'kiralik-arac'       },
      { name: 'Diğer',         slug: 'kiralik-diger'      },
    ],
  },
];

// ─── Paylaşım ─────────────────────────────────────────────────────────────────

/** WhatsApp paylaşım mesaj şablonu. {title} ve {url} dinamik olarak doldurulur. */
export const WHATSAPP_SHARE_TEMPLATE =
  'Merhaba! Şu ilanı gördüm ve ilgini çekebilir: *{title}* — {url}';

/** Telegram paylaşım başlık şablonu */
export const TELEGRAM_SHARE_TEMPLATE = 'İlana göz at: {title}';

// ─── Navigasyon ───────────────────────────────────────────────────────────────

/** Giriş gerektirmeyen statik nav linkleri */
export const STATIC_NAV_LINKS = [
  { label: 'Anasayfa', href: '/' },
];

/** Giriş yapılmış kullanıcı için ek nav linkleri */
export const AUTH_NAV_LINKS = [
  { label: 'İlan Ver',    href: '/ilan-ver'  },
  { label: 'Mesajlarım', href: '/mesajlar'  },
  { label: 'Profilim',   href: '/profilim'  },
];

// ─── Hata Mesajları ───────────────────────────────────────────────────────────

/** Kullanıcıya gösterilecek genel hata mesajları */
export const ERROR_MESSAGES = {
  generic:       'Bir hata oluştu. Lütfen tekrar deneyin.',
  notFound:      'Aradığınız sayfa veya ilan bulunamadı.',
  unauthorized:  'Bu işlem için giriş yapmanız gerekiyor.',
  forbidden:     'Bu sayfaya erişim yetkiniz yok.',
  uploadFailed:  'Fotoğraf yüklenirken bir hata oluştu.',
};

// ─── Başarı Mesajları ─────────────────────────────────────────────────────────

/** Kullanıcıya gösterilecek başarı mesajları */
export const SUCCESS_MESSAGES = {
  adCreated:   'İlanınız başarıyla yayınlandı!',
  adUpdated:   'İlan güncellendi.',
  adDeleted:   'İlan silindi.',
  messageSent: 'Mesajınız gönderildi.',
  profileSaved:'Profil kaydedildi.',
};

// ─── PWA ──────────────────────────────────────────────────────────────────────

/** PWA manifest bilgileri */
export const PWA_CONFIG = {
  name:             SITE_NAME,
  shortName:        '123',
  description:      SITE_DESCRIPTION,
  themeColor:       '#0ea5e9',
  backgroundColor:  '#ffffff',
  display:          'standalone',
  startUrl:         '/',
};
