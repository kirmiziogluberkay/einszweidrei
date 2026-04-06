/**
 * lib/helpers.js
 * ─────────────────────────────────────────────────────
 * Proje genelinde kullanılan yardımcı saf fonksiyonlar.
 * ─────────────────────────────────────────────────────
 */

import {
  CURRENCY_SYMBOL,
  PRICE_LOCALE,
  DEFAULT_CURRENCY,
  WHATSAPP_SHARE_TEMPLATE,
  TELEGRAM_SHARE_TEMPLATE,
  SITE_URL,
  AD_URL_PREFIX,
} from '@/constants/config';

// ─── Fiyat Formatlama ─────────────────────────────────────────────────────────

/**
 * Sayıyı Türk Lirası formatında biçimlendirir.
 * Örnek: 1500 → "₺1.500,00"
 *
 * @param {number|null} price - Fiyat değeri
 * @param {string} [currency] - Para birimi kodu (varsayılan: TRY)
 * @returns {string} Formatlanmış fiyat metni
 */
export function formatPrice(price, currency = DEFAULT_CURRENCY) {
  if (price === null || price === undefined || price === 0) return 'Free';

  return new Intl.NumberFormat(PRICE_LOCALE, {
    style:    'currency',
    currency: DEFAULT_CURRENCY, // her zaman site geneli (EUR) kullanılsın
  }).format(price);
}

// ─── Tarih Formatlama ─────────────────────────────────────────────────────────

/**
 * ISO tarih stringini insan okunabilir formata çevirir.
 * Örnek: "2024-01-15T12:00:00Z" → "15 Ocak 2024"
 *
 * @param {string} dateString - ISO formatında tarih
 * @returns {string} Türkçe biçimlendirilmiş tarih
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
 * ISO tarih stringini '15 Jan, 14:30' formatına çevirir.
 *
 * @param {string} dateString - ISO formatında tarih
 * @returns {string} Saat/dakika içeren tarih
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
 * Tarihi göreceli olarak biçimlendirir.
 * Örnek: "2 saat önce", "3 gün önce"
 *
 * @param {string} dateString - ISO formatında tarih
 * @returns {string} Göreceli zaman metni
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

// ─── URL Yardımcıları ─────────────────────────────────────────────────────────

/**
 * Seri numarasından ilan URL'i oluşturur.
 *
 * @param {string} serialNumber - İlanın seri numarası
 * @returns {string} Tam URL (ör: "/ilan/AB12CD34")
 */
export function buildAdUrl(serialNumber) {
  return `${AD_URL_PREFIX}/${serialNumber}`;
}

/**
 * Seri numarasından ilan'ın tam (absolute) URL'ini oluşturur.
 *
 * @param {string} serialNumber - İlanın seri numarası
 * @returns {string} Tam URL (ör: "https://site.com/ilan/AB12CD34")
 */
export function buildAdAbsoluteUrl(serialNumber) {
  return `${SITE_URL}${buildAdUrl(serialNumber)}`;
}

// ─── Paylaşım Linkleri ────────────────────────────────────────────────────────

/**
 * İlan için WhatsApp paylaşım URL'i oluşturur.
 *
 * @param {string} title - İlan başlığı
 * @param {string} serialNumber - İlan seri numarası
 * @returns {string} WhatsApp paylaşım URL'i
 */
export function buildWhatsAppShareUrl(title, serialNumber) {
  const adUrl = buildAdAbsoluteUrl(serialNumber);
  const text = WHATSAPP_SHARE_TEMPLATE
    .replace('{title}', title)
    .replace('{url}', adUrl);

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * İlan için Telegram paylaşım URL'i oluşturur.
 *
 * @param {string} title - İlan başlığı
 * @param {string} serialNumber - İlan seri numarası
 * @returns {string} Telegram paylaşım URL'i
 */
export function buildTelegramShareUrl(title, serialNumber) {
  const adUrl = buildAdAbsoluteUrl(serialNumber);
  const text = TELEGRAM_SHARE_TEMPLATE
    .replace('{title}', title);

  return `https://t.me/share/url?url=${encodeURIComponent(adUrl)}&text=${encodeURIComponent(text)}`;
}

// ─── Slug & Metin Araçları ────────────────────────────────────────────────────

/**
 * Türkçe karakterleri işleyerek URL dostu slug oluşturur.
 *
 * @param {string} text - Dönüştürülecek metin
 * @returns {string} URL-safe slug
 */
export function slugify(text) {
  const trMap = { ç:'c', ğ:'g', ı:'i', ö:'o', ş:'s', ü:'u',
                  Ç:'C', Ğ:'G', İ:'I', Ö:'O', Ş:'S', Ü:'U' };
  return text
    .split('')
    .map((c) => trMap[c] || c)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Uzun metni belirtilen uzunlukta kırpar ve "..." ekler.
 *
 * @param {string} text - Kırpılacak metin
 * @param {number} [maxLength=120] - Maksimum karakter sayısı
 * @returns {string} Kırpılmış metin
 */
export function truncateText(text, maxLength = 120) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Kullanıcı adını ilk harfi büyük, kalanı küçük olacak şekilde formatlar.
 * Örnek: "BERKAY" -> "Berkay", "berkay" -> "Berkay"
 *
 * @param {string} name - Kullanıcı adı
 * @returns {string} Formatlanmış isim
 */
export function formatUsername(name) {
  if (!name) return '';
  const str = String(name);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

/**
 * Supabase Storage'daki bir dosyanın public URL'ini döndürür.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket - Bucket adı
 * @param {string} path - Dosya yolu
 * @returns {string} Public URL
 */
export function getStorageUrl(supabase, bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

// ─── Kategori Yardımcıları ────────────────────────────────────────────────────

/**
 * Düz kategori listesini ağaç yapısına dönüştürür.
 * parent_id = null olan kategoriler kök olarak kabul edilir.
 *
 * @param {Array<{id:string, name:string, parent_id:string|null}>} categories
 * @returns {Array} Ağaç yapısında kategoriler
 */
export function buildCategoryTree(categories) {
  const map = {};
  const roots = [];

  // Her kategoriyi id'ye göre indexle
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });

  // Ebeveyn-çocuk ilişkisini kur
  categories.forEach((cat) => {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children.push(map[cat.id]);
    } else if (!cat.parent_id) {
      roots.push(map[cat.id]);
    }
  });

  return roots;
}

// ─── CSS Araçları ─────────────────────────────────────────────────────────────

/**
 * Koşullu class string'leri birleştirir (clsx benzeri yardımcı).
 *
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string} Birleştirilmiş class string'i
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
