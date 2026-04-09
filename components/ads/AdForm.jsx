// update 17:02
// update 16:42
/**
 * components/ads/AdForm.jsx
 * ─────────────────────────────────────────────────────
 * Form component used for both creating new ads and
 * editing existing ones.
 *
 * - Photo upload (Supabase Storage)
 * - Category selection (hierarchical)
 * - Draft saving and publishing
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
import { buildAdUrl, cn } from '@/lib/helpers';

/**
 * @param {{
 *   initialData?: object  // Existing ad data in edit mode
 * }} props
 */
export default function AdForm({ initialData = null }) {
  const supabase  = createClient();
  const router    = useRouter();
  const { user, isAdmin } = useAuth();
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  /** Form field values */
  const [formData, setFormData] = useState({
    title:       initialData?.title       ?? '',
    description: initialData?.description ?? '',
    price:       initialData?.price       ?? '',
    category_id: initialData?.category_id ?? '',
    area:        initialData?.area        ?? '',
    payment_methods: (initialData?.payment_methods ?? []).map(m => 
      m?.toLowerCase() === 'paypal' ? 'PayPal' : (m?.toLowerCase() === 'cash' ? 'Cash' : m)
    ),
  });

  /** URLs of uploaded photos (Supabase Storage) */
  const [uploadedImages, setUploadedImages] = useState(initialData?.images ?? []);

  /** Local preview objects during upload process */
  const [previews, setPreviews] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /**
   * Updates a single form field.
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
    } else if (name === 'price') {
      const numValue = parseFloat(value);
      const isFree = !value || numValue === 0;
      
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        // If price is missing or 0, clear payment methods
        payment_methods: isFree ? [] : prev.payment_methods 
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Uploads files selected by the user to Supabase Storage.
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

      // Unique file path: owner_id/timestamp_randomsuffix.ext
      const ext      = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(ERROR_MESSAGES.uploadFailed);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      newUrls.push(publicUrl);
    }

    setUploadedImages((prev) => [...prev, ...newUrls]);
    setUploading(false);

    // Reset input (same file can be selected again)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Removes the photo at the specified index from the list.
   * (File in Supabase Storage is not deleted, only the reference is removed)
   *
   * @param {number} index
   */
  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Submits the form; creates a new ad or updates existing one.
   *
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    // Basic validation
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

    const selectedCategoryObj = categories.find(c => c.id === formData.category_id);
    const isAccommodation = selectedCategoryObj?.slug === 'accommodation-apartment' || 
                           selectedCategoryObj?.slug === 'accommodation-room';

    const priceNum = formData.price ? parseFloat(formData.price) : 0;
    if (priceNum > 0 && !isAccommodation && (!formData.payment_methods || formData.payment_methods.length === 0)) {
      setError('Please select at least one payment method for paid ads.');
      setSubmitting(false);
      return;
    }

    const payload = {
      title:       formData.title.trim(),
      description: formData.description.trim(),
      price:       formData.price ? parseFloat(formData.price) : null,
      currency:    DEFAULT_CURRENCY,
      category_id: formData.category_id || null,
      area:        isAccommodation ? (parseFloat(formData.area) || null) : null,
      images:      uploadedImages,
      payment_methods: formData.payment_methods,
      // To avoid changing the ad owner when an admin updates someone else's ad:
      owner_id:    initialData?.owner_id || user.id,
    };

    let result;

    if (initialData?.id) {
      // ── Update mode ──
      let query = supabase
        .from('ads')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', initialData.id);

      // If NOT admin, require owning the ad to update
      if (!isAdmin) {
        query = query.eq('owner_id', user.id);
      }

      result = await query.select('serial_number').single();
    } else {
      // ── Creation mode (serial_number assigned via trigger) ──
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

    // Redirect to ad detail page
    setTimeout(() => {
      router.push(buildAdUrl(data.serial_number));
      router.refresh();
    }, 800);
  };

    const isAccommodation = categories.find(c => c.id === formData.category_id)?.slug?.startsWith('accommodation');

    return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>

      {/* ── Error / Success messages ── */}
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



      {/* ── Category ── */}
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
            // First root categories
            .filter((c) => !c.parent_id)
            .map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                {/* Child categories */}
                {categories
                  .filter((c) => c.parent_id === parent.id)
                  .map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
              </optgroup>
            ))}
        </select>
      </div>

      {/* ── Title ── */}
      <div>
        <label htmlFor="ad-title" className="label">Ad Title *</label>
        <input
          id="ad-title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={isAccommodation ? "Write a short title describing your place" : "Write a short title describing your item"}
          maxLength={100}
          required
          className="input"
        />
      </div>

      {/* ── Description ── */}
      <div>
        <label htmlFor="ad-description" className="label">Description</label>
        <textarea
          id="ad-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          placeholder={isAccommodation 
            ? "Provide detailed information about the place (condition, features, etc.)" 
            : "Provide detailed information about the item (condition, features, etc.)"}
          className="input resize-none"
        />
      </div>

      {/* ── Price and Area (side by side) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Price / Rent */}
        <div>
          <label htmlFor="ad-price" className="label">
            {isAccommodation ? 'Rent' : 'Price'} ({CURRENCY_SYMBOL})
          </label>
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
          <p className="text-xs text-ink-tertiary mt-1">
            Leave empty or write 0 → "Free"
          </p>
        </div>

        {/* Area (m²) - Conditional */}
        {isAccommodation && (
          <div>
            <label htmlFor="ad-area" className="label">Area (m²) *</label>
            <input
              id="ad-area"
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="e.g. 85"
              min="1"
              required
              className="input"
            />
          </div>
        )}
      </div>

      {/* ── Payment Methods ── */}
      {!isAccommodation && (
        <div>
          <label className="label">Payment Methods {(!formData.price || parseFloat(formData.price) === 0) ? '(Disabled for Free ads)' : '*'}</label>
          <div className="flex flex-wrap gap-4 mt-2">
            <label className={cn(
              "flex items-center gap-2 cursor-pointer group",
              (!formData.price || parseFloat(formData.price) === 0) && "opacity-50 cursor-not-allowed"
            )}>
              <input
                type="checkbox"
                name="payment_methods"
                value="Cash"
                disabled={!formData.price || parseFloat(formData.price) === 0}
                checked={formData.payment_methods.includes('Cash')}
                onChange={handleChange}
                className="w-5 h-5 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">Cash</span>
            </label>
            <label className={cn(
              "flex items-center gap-2 cursor-pointer group",
              (!formData.price || parseFloat(formData.price) === 0) && "opacity-50 cursor-not-allowed"
            )}>
              <input
                type="checkbox"
                name="payment_methods"
                value="PayPal"
                disabled={!formData.price || parseFloat(formData.price) === 0}
                checked={formData.payment_methods.includes('PayPal')}
                onChange={handleChange}
                className="w-5 h-5 rounded border-surface-tertiary text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">PayPal</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Photo upload ── */}
      <div>
        <label className="label">Photos <span className="text-ink-tertiary font-normal">({uploadedImages.length}/{MAX_IMAGES_PER_AD})</span></label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {/* Uploaded photos */}
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

          {/* Upload button */}
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

        {/* Hidden file input */}
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
