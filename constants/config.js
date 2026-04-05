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
  'Second-hand buy-sell and rental items platform. Safe, easy, and fast.';

/** Anasayfada hero bölümünde gösterilen slogan */
export const SITE_TAGLINE = 'Second-Hand & Rental Items Platform';

/** Geliştirici / şirket adı */
export const SITE_AUTHOR = 'Einszweidrei';

// ─── URL Yapılandırması ───────────────────────────────────────────────────────

/** Üretim ortamındaki site URL'i (Vercel'e deploy sonrası güncelle) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://einszweidrei.vercel.app';

/** İlan detay sayfası URL öneki */
export const AD_URL_PREFIX = '/adv';

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
export const DEFAULT_CURRENCY = 'EUR';

/** Para birimi sembolü */
export const CURRENCY_SYMBOL = '€';

/** Fiyat formatı için locale */
export const PRICE_LOCALE = 'en-US';

// ─── İlan Durumları ───────────────────────────────────────────────────────────

/** Mevcut ilan durumları ve etiketleri */
export const AD_STATUSES = {
  active:  { label: 'Active',  color: 'green' },
  passive: { label: 'Passive', color: 'gray'  },
  sold:    { label: 'Sold',    color: 'red'   },
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
  '/post-ad',
  '/profile',
  '/messages',
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
    name:      'Second Hand Items',
    slug:      'second-hand-items',
    parent_id: null,
    children:  [
      { name: 'Electronics',       slug: 'second-hand-electronics' },
      { name: 'Furniture',         slug: 'second-hand-furniture'   },
      { name: 'Clothing & Accs.',  slug: 'second-hand-clothing'    },
      { name: 'Sports & Outdoor',  slug: 'second-hand-sports'      },
      { name: 'Books & Hobbies',   slug: 'second-hand-books'       },
      { name: 'Other',             slug: 'second-hand-other'       },
    ],
  },
  {
    name:      'Rental Items',
    slug:      'rental-items',
    parent_id: null,
    children:  [
      { name: 'Electronics',    slug: 'rental-electronics' },
      { name: 'Camping & Outdoor', slug: 'rental-camping'  },
      { name: 'Tools & Eq.',    slug: 'rental-tools'       },
      { name: 'Other',          slug: 'rental-other'       },
    ],
  },
];

// ─── Paylaşım ─────────────────────────────────────────────────────────────────

/** WhatsApp paylaşım mesaj şablonu. {title} ve {url} dinamik olarak doldurulur. */
export const WHATSAPP_SHARE_TEMPLATE =
  'Hello! I saw this ad and thought you might be interested: *{title}* — {url}';

/** Telegram paylaşım başlık şablonu */
export const TELEGRAM_SHARE_TEMPLATE = 'Check out this ad: {title}';

// ─── Navigasyon ───────────────────────────────────────────────────────────────

/** Giriş gerektirmeyen statik nav linkleri */
export const STATIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
];

/** Giriş yapılmış kullanıcı için ek nav linkleri */
export const AUTH_NAV_LINKS = [
  { label: 'Messages',   href: '/mesajlar'  },
  { label: 'My Profile', href: '/myprofile'  },
];

// ─── Hata Mesajları ───────────────────────────────────────────────────────────

/** Kullanıcıya gösterilecek genel hata mesajları */
export const ERROR_MESSAGES = {
  generic:       'An error occurred. Please try again.',
  notFound:      'The page or ad you are looking for could not be found.',
  unauthorized:  'You need to log in to perform this action.',
  forbidden:     'You do not have permission to access this page.',
  uploadFailed:  'An error occurred while uploading the photo.',
};

// ─── Başarı Mesajları ─────────────────────────────────────────────────────────

/** Kullanıcıya gösterilecek başarı mesajları */
export const SUCCESS_MESSAGES = {
  adCreated:   'Your ad has been successfully published!',
  adUpdated:   'Ad updated successfully.',
  adDeleted:   'Ad deleted successfully.',
  messageSent: 'Your message has been sent.',
  profileSaved:'Profile saved successfully.',
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
