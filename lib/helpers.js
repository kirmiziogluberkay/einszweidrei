/**
 * lib/helpers.js
 * ─────────────────────────────────────────────────────
 * Pure utility functions used throughout the project.
 * ─────────────────────────────────────────────────────
 */

import {
  PRICE_LOCALE,
  DEFAULT_CURRENCY,
  WHATSAPP_SHARE_TEMPLATE,
  TELEGRAM_SHARE_TEMPLATE,
  SITE_URL,
  AD_URL_PREFIX,
} from '@/constants/config';

// ─── Price Formatting ─────────────────────────────────────────────────────────

/**
 * Formats a number as a currency string.
 * Example: 1500 → "€1,500.00"
 *
 * @param {number|null} price - Price value
 * @param {string} [currency] - Currency code (default: site default)
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free';

  return new Intl.NumberFormat(PRICE_LOCALE, {
    style:    'currency',
    currency: DEFAULT_CURRENCY,
  }).format(price);
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

/**
 * Converts an ISO date string to a human-readable format.
 * Example: "2024-01-15T12:00:00Z" → "January 15, 2024"
 *
 * @param {string} dateString - ISO format date
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      day:   'numeric',
      month: 'long',
      year:  'numeric',
    }).format(d);
  } catch (e) {
    return '';
  }
}

/**
 * Converts an ISO date string to '15 Jan, 14:30' format.
 *
 * @param {string} dateString - ISO format date
 * @returns {string} Date with time
 */
export function formatMessageDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      day:    'numeric',
      month:  'short',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch (e) {
    return '';
  }
}

/**
 * Formats a date as a relative time string.
 * Example: "2 hours ago", "3 days ago"
 *
 * @param {string} dateString - ISO format date
 * @returns {string} Relative time string
 */
export function timeAgo(dateString) {
  if (!dateString) return '';

  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  const intervals = [
    { label: 'year',   seconds: 31536000 },
    { label: 'month',  seconds: 2592000  },
    { label: 'week',   seconds: 604800   },
    { label: 'day',    seconds: 86400    },
    { label: 'hour',   seconds: 3600     },
    { label: 'minute', seconds: 60       },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
  }

  return 'Just now';
}

// ─── URL Helpers ──────────────────────────────────────────────────────────────

/**
 * Builds the relative URL for an ad from its serial number.
 *
 * @param {string} serialNumber - Ad serial number
 * @returns {string} Relative URL (e.g. "/adv/AB12CD34")
 */
export function buildAdUrl(serialNumber) {
  return `${AD_URL_PREFIX}/${serialNumber}`;
}

/**
 * Builds the absolute URL for an ad from its serial number.
 *
 * @param {string} serialNumber - Ad serial number
 * @returns {string} Absolute URL (e.g. "https://site.com/adv/AB12CD34")
 */
export function buildAdAbsoluteUrl(serialNumber) {
  return `${SITE_URL}${buildAdUrl(serialNumber)}`;
}

// ─── Share Links ──────────────────────────────────────────────────────────────

/**
 * Builds a WhatsApp share URL for an ad.
 *
 * @param {string} title - Ad title
 * @param {string} serialNumber - Ad serial number
 * @returns {string} WhatsApp share URL
 */
export function buildWhatsAppShareUrl(title, serialNumber) {
  const adUrl = buildAdAbsoluteUrl(serialNumber);
  const text = WHATSAPP_SHARE_TEMPLATE
    .replace('{title}', title)
    .replace('{url}', adUrl);

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Builds a Telegram share URL for an ad.
 *
 * @param {string} title - Ad title
 * @param {string} serialNumber - Ad serial number
 * @returns {string} Telegram share URL
 */
export function buildTelegramShareUrl(title, serialNumber) {
  const adUrl = buildAdAbsoluteUrl(serialNumber);
  const text = TELEGRAM_SHARE_TEMPLATE
    .replace('{title}', title);

  return `https://t.me/share/url?url=${encodeURIComponent(adUrl)}&text=${encodeURIComponent(text)}`;
}

// ─── Slug & Text Utilities ────────────────────────────────────────────────────

/**
 * Creates a URL-friendly slug, handling extended Latin characters.
 *
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
export function slugify(text) {
  const charMap = { ç:'c', ğ:'g', ı:'i', ö:'o', ş:'s', ü:'u',
                    Ç:'C', Ğ:'G', İ:'I', Ö:'O', Ş:'S', Ü:'U' };
  return text
    .split('')
    .map((c) => charMap[c] || c)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Truncates a long string to the given length and appends "...".
 *
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=120] - Maximum character count
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 120) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalises the first letter of a username, lowercases the rest.
 * Example: "BERKAY" → "Berkay"
 *
 * @param {string} name - Username
 * @returns {string} Formatted name
 */
export function formatUsername(name) {
  if (!name) return '';
  const str = String(name);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

/**
 * Returns the public URL of a file in Supabase Storage.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {string} Public URL
 */
export function getStorageUrl(supabase, bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

// ─── Category Helpers ─────────────────────────────────────────────────────────

/**
 * Converts a flat category list into a tree structure.
 * Categories with parent_id = null are treated as roots.
 *
 * @param {Array<{id:string, name:string, parent_id:string|null}>} categories
 * @returns {Array} Categories in tree structure
 */
export function buildCategoryTree(categories) {
  const map = {};
  const roots = [];

  // Discard any row that is missing the required fields so a bad DB record
  // cannot throw a TypeError during rendering.
  const valid = (categories ?? []).filter(
    (cat) => cat && cat.id != null && cat.name && cat.slug
  );

  // Index each valid category by id
  valid.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });

  // Build parent-child relationships.
  // If parent_id is set but the parent doesn't exist in the map (deleted parent,
  // data inconsistency) the category is promoted to root so it is never silently lost.
  valid.forEach((cat) => {
    if (cat.parent_id) {
      if (map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else {
        // Orphaned child — promote to root so it stays visible
        roots.push(map[cat.id]);
      }
    } else {
      roots.push(map[cat.id]);
    }
  });

  return roots;
}

// ─── CSS Utilities ────────────────────────────────────────────────────────────

/**
 * Merges conditional class strings (clsx-like helper).
 *
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string} Merged class string
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
