/**
 * components/ads/AdForm.jsx
 * ─────────────────────────────────────────────────────
 * Hem yeni ilan oluşturma hem de mevcut ilan düzenleme
 * için kullanılan form bileşeni.
 *
 * - Fotoğraf yükleme (Supabase Storage)
 * - Kategori seçimi (hiyerarşik)
 * - Taslak kaydetme ve yayına alma
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import {
  STORAGE_BUCKET,
  MAX_IMAGES_PER_AD,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  CURRENCY_SYMBOL,
  DEFAULT_CURRENCY,
} from '@/constants/config';
import { buildAdUrl } from '@/lib/helpers';

/**
 * @param {{
 *   initialData?: object  // Düzenleme modunda mevcut ilan verisi
 * }} props
 */
export default function AdForm({ initialData = null }) {
  const supabase  = createClient();
  const router    = useRouter();
  const { user, isAdmin } = useAuth();
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  /** Form alanı değerleri */
  const [formData, setFormData] = useState({
    title:       initialData?.title       ?? '',
    description: initialData?.description ?? '',
    price:       initialData?.price       ?? '',
    category_id: initialData?.category_id ?? '',
    payment_methods: initialData?.payment_methods ?? [],
    tags:            initialData?.tags?.join(', ') ?? '',
  });

  /** Yüklenmiş fotoğrafların URL'leri (Supabase Storage) */
  const [uploadedImages, setUploadedImages] = useState(initialData?.images ?? []);

  /** Yükleme sürecindeki yerel önizleme nesneleri */
  const [previews, setPreviews] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /**
   * Tek bir form alanını günceller.
   *
   * @param {React.ChangeEvent} e
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name === 'payment_methods') {
      setFormData((prev) => {
        const methods = [...prev.payment_methods];
        if (checked) {
          if (!methods.includes(value)) methods.push(value);
        } else {
          const index = methods.indexOf(value);
          if (index > -1) methods.splice(index, 1);
        }
        return { ...prev, [name]: methods };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Kullanıcının seçtiği dosyaları Supabase Storage'a yükler.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES_PER_AD - uploadedImages.length;
    if (remaining <= 0) {
      setError(`You can upload a maximum of ${MAX_IMAGES_PER_AD} photos.`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    setUploading(true);
    setError(null);

    const newUrls = [];

    for (const file of filesToUpload) {
      // Boyut kontrolü
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`The file "${file.name}" cannot be larger than 5 MB.`);
        continue;
      }

      // Format kontrolü
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG and WebP formats are accepted.');
        continue;
      }

      // Benzersiz dosya yolu: owner_id/timestamp_randomsuffix.ext
      const ext      = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(ERROR_MESSAGES.uploadFailed);
        continue;
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      newUrls.push(publicUrl);
    }

    setUploadedImages((prev) => [...prev, ...newUrls]);
    setUploading(false);

    // Input'u sıfırla (aynı dosya tekrar seçilebilsin)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Belirtilen indeksteki fotoğrafı listeden kaldırır.
   * (Supabase Storage'daki dosya silinmez, sadece referans kaldırılır)
   *
   * @param {number} index
   */
  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Formu submit eder; yeni ilan oluşturur veya mevcutu günceller.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    // Temel doğrulama
    if (!formData.title.trim()) {
      setError('Title is required.');
      setSubmitting(false);
      return;
    }

    if (!formData.category_id) {
      setError('Please select a category for your ad.');
      setSubmitting(false);
      return;
    }

    const payload = {
      title:       formData.title.trim(),
      description: formData.description.trim(),
      price:       formData.price ? parseFloat(formData.price) : null,
      currency:    DEFAULT_CURRENCY,
      category_id: formData.category_id || null,
      images:      uploadedImages,
      payment_methods: formData.payment_methods,
      tags:            formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== ''),
      // Admin başkasının ilanını güncellerken ilan sahibini değiştirmemek için:
      owner_id:    initialData?.owner_id || user.id,
    };

    let result;

    if (initialData?.id) {
      // ── Güncelleme modu ──
      let query = supabase
        .from('ads')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', initialData.id);

      // Sadece admin DEĞİLSE kendi ilanını değiştirme şartı koş
      if (!isAdmin) {
        query = query.eq('owner_id', user.id);
      }

      result = await query.select('serial_number').single();
    } else {
      // ── Oluşturma modu (serial_number trigger ile atanır) ──
      result = await supabase
        .from('ads')
        .insert(payload)
        .select('serial_number')
        .single();
    }

    const { data, error: dbError } = result;

    if (dbError) {
      setError(dbError.message || ERROR_MESSAGES.generic);
      setSubmitting(false);
      return;
    }

    setSuccessMsg(initialData ? SUCCESS_MESSAGES.adUpdated : SUCCESS_MESSAGES.adCreated);
    setSubmitting(false);

    // İlan detay sayfasına yönlendir
    setTimeout(() => {
      router.push(buildAdUrl(data.serial_number));
      router.refresh();
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>

      {/* ── Hata / Başarı mesajları ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-sm">
          {successMsg}
        </div>
      )}

      {/* ── Fotoğraf yükleme ── */}
      <div>
        <label className="label">Photos <span className="text-ink-tertiary font-normal">({uploadedImages.length}/{MAX_IMAGES_PER_AD})</span></label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {/* Yüklenmiş fotoğraflar */}
          {uploadedImages.map((url, index) => (
            <div key={url} className="relative aspect-square rounded-2xl overflow-hidden group">
              <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label="Remove photo"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Yükleme butonu */}
          {uploadedImages.length < MAX_IMAGES_PER_AD && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-surface-tertiary
                         flex flex-col items-center justify-center gap-2 text-ink-tertiary text-xs
                         hover:border-brand-400 hover:text-brand-400 transition-colors
                         disabled:opacity-50 disabled:cursor-wait"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Gizli dosya input'u */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Select photo"
        />
        <p className="text-xs text-ink-tertiary mt-2">
          PNG, JPG or WebP — max {MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB
        </p>
      </div>

      {/* ── Başlık ── */}
      <div>
        <label htmlFor="ad-title" className="label">Ad Title *</label>
        <input
          id="ad-title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Write a short title describing your item"
          maxLength={100}
          required
          className="input"
        />
      </div>

      {/* ── Açıklama ── */}
      <div>
        <label htmlFor="ad-description" className="label">Description</label>
        <textarea
          id="ad-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          placeholder="Provide detailed information about the item (condition, features, etc.)"
          className="input resize-none"
        />
      </div>

      {/* ── Fiyat ve Kategori (yan yana) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Fiyat */}
        <div>
          <label htmlFor="ad-price" className="label">Price ({CURRENCY_SYMBOL})</label>
          <input
            id="ad-price"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0,00"
            min="0"
            step="0.01"
            className="input"
          />
          <p className="text-xs text-ink-tertiary mt-1">Leave empty or write 0 → "Free"</p>
        </div>

        {/* Kategori */}
        <div>
          <label htmlFor="ad-category" className="label">Category *</label>
          <select
            id="ad-category"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="" disabled>Select Category</option>
            {categories
              // Önce üst kategoriler
              .filter((c) => !c.parent_id)
              .map((parent) => (
                <optgroup key={parent.id} label={parent.name}>
                  {/* Alt kategoriler */}
                  {categories
                    .filter((c) => c.parent_id === parent.id)
                    .map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                </optgroup>
              ))}
          </select>
        </div>
      </div>

      {/* ── Ödeme Yöntemleri & Tagler ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Ödeme Yöntemleri */}
        <div>
          <label className="label">Payment Methods</label>
          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="payment_methods"
                value="Cash"
                checked={formData.payment_methods.includes('Cash')}
                onChange={handleChange}
                className="w-5 h-5 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">Cash</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="payment_methods"
                value="PayPal"
                checked={formData.payment_methods.includes('PayPal')}
                onChange={handleChange}
                className="w-5 h-5 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">PayPal</span>
            </label>
          </div>
        </div>

        {/* Tagler */}
        <div>
          <label htmlFor="ad-tags" className="label">Tags</label>
          <input
            id="ad-tags"
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g. guitar, music, wood (separate by comma)"
            className="input"
          />
          <p className="text-xs text-ink-tertiary mt-1">Keywords for better searchability.</p>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="btn-primary flex-1 sm:flex-none sm:min-w-[160px]"
          id="ad-submit-btn"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? 'Update' : 'Publish Ad'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
