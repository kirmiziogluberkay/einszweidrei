// update 17:02
// status: reserved and rented definitions added
/**
 * constants/config.js
 * =====================================================
 * All constant settings and configuration of the application.
 * All texts and values that are likely to be changed in the future
 * are managed from here.
 * =====================================================
 */

// ─── General Site Information ─────────────────────────────────────────────────────

/** Site name used in browser tab and for SEO */
export const SITE_NAME = 'EinsZweiDrei';

/** Site description (meta description) */
export const SITE_DESCRIPTION =
  'Second-hand buy-sell and rental items platform. Safe, easy, and fast.';

/** Slogan shown in the hero section on the homepage */
export const SITE_TAGLINE = 'Second-Hand & Rental Items Platform';

/** Developer / company name */
export const SITE_AUTHOR = 'EinsZweiDrei';

// ─── URL Configuration ───────────────────────────────────────────────────────

/** Site URL in production environment (update after Vercel deployment) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://einszweidrei.vercel.app';

/** Ad detail page URL prefix */
export const AD_URL_PREFIX = '/adv';

// ─── Pagination ────────────────────────────────────────────────────────────────

/** How many ads are shown at once on the home page */
export const ADS_PER_PAGE = 12;

/** How many records are shown at once in the admin panel */
export const ADMIN_ITEMS_PER_PAGE = 20;

// ─── Photo Upload ─────────────────────────────────────────────────────────

/** Supabase Storage bucket name */
export const STORAGE_BUCKET = 'ad-images';

/** Maximum number of photos that can be uploaded to an ad */
export const MAX_IMAGES_PER_AD = 6;

/** Maximum size of a single photo (byte) — 5 MB */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed file formats */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Currency ──────────────────────────────────────────────────────────────

/** Default currency code */
export const DEFAULT_CURRENCY = 'EUR';

/** Currency symbol */
export const CURRENCY_SYMBOL = '€';

/** Locale for price format */
export const PRICE_LOCALE = 'en-US';

// ─── Ad Statuses ───────────────────────────────────────────────────────────

/** Available ad statuses and labels */
export const AD_STATUSES = {
  active:   { label: 'Active',   color: 'green' },
  reserved: { label: 'Reserved', color: 'amber' },
  rented:   { label: 'Rented',   color: 'blue'  },
  passive:  { label: 'Passive',  color: 'gray'  },
  sold:     { label: 'Sold',     color: 'red'   },
};

// ─── User Roles ────────────────────────────────────────────────────────

/** Roles defined throughout the application */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER:  'user',
};

// ─── Auth Security ───────────────────────────────────────────────────────────

/** Role required to access the admin panel */
export const ADMIN_REQUIRED_ROLE = USER_ROLES.ADMIN;

/** Routes that cannot be accessed without logging in (used in middleware) */
export const PROTECTED_ROUTES = [
  '/post-ad',
  '/profile',
  '/messages',
  '/admin',
];

/** URL prefix for the admin panel */
export const ADMIN_ROUTE_PREFIX = '/admin';

// ─── Initial Categories ───────────────────────────────────────────────────
/**
 * Used for seed when the database is empty.
 * Can be managed dynamically from the admin panel.
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
  {
    name:      'Accommodation',
    slug:      'accommodation',
    parent_id: null,
    children:  [
      { name: 'Apartment', slug: 'accommodation-apartment' },
      { name: 'Room',      slug: 'accommodation-room'      },
    ],
  },
  {
    name:      'Services',
    slug:      'services',
    parent_id: null,
    children:  [
      { name: 'Ironing', slug: 'services-ironing' },
    ],
  },
];

// ─── Sharing ─────────────────────────────────────────────────────────────────

/** WhatsApp sharing message template. {title} and {url} are filled dynamically. */
export const WHATSAPP_SHARE_TEMPLATE =
  'Hello! I saw this ad and thought you might be interested: *{title}* — {url}';

/** Telegram sharing title template */
export const TELEGRAM_SHARE_TEMPLATE = 'Check out this ad: {title}';

// ─── Navigation ───────────────────────────────────────────────────────────────

/** Static nav links that do not require login */
export const STATIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
];

/** Additional nav links for logged-in users */
export const AUTH_NAV_LINKS = [
  { label: 'Messages',   href: '/inbox'        },
  { label: 'Saved Ads',  href: '/myprofile/saved-ads'  },
  { label: 'My Ads',     href: '/myprofile/my-ads'    },
  { label: 'Profile',    href: '/myprofile'    },
];

// ─── Error Messages ───────────────────────────────────────────────────────────

/** General error messages to be shown to the user */
export const ERROR_MESSAGES = {
  generic:       'An error occurred. Please try again.',
  notFound:      'The page or ad you are looking for could not be found.',
  unauthorized:  'You need to log in to perform this action.',
  forbidden:     'You do not have permission to access this page.',
  uploadFailed:  'An error occurred while uploading the photo.',
};

// ─── Success Messages ─────────────────────────────────────────────────────────

/** Success messages to be shown to the user */
export const SUCCESS_MESSAGES = {
  adCreated:   'Your ad has been successfully published!',
  adUpdated:   'Ad updated successfully.',
  adDeleted:   'Ad deleted successfully.',
  messageSent: 'Your message has been sent.',
  profileSaved:'Profile saved successfully.',
};

// ─── PWA ──────────────────────────────────────────────────────────────────────

/** PWA manifest information */
export const PWA_CONFIG = {
  name:             SITE_NAME,
  shortName:        '123',
  description:      SITE_DESCRIPTION,
  themeColor:       '#0ea5e9',
  backgroundColor:  '#ffffff',
  display:          'standalone',
  startUrl:         '/',
};
