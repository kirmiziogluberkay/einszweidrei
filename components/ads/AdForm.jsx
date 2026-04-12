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
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle, Star } from 'lucide-react';
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
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  /** Form field values */
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price ?? '',
    category_id: initialData?.category_id ?? '',
    area: initialData?.area ?? '',
    tags: initialData?.tags ?? [],
    payment_methods: (initialData?.payment_methods ?? []).map(m =>
      m?.toLowerCase() === 'paypal' ? 'PayPal' : (m?.toLowerCase() === 'cash' ? 'Cash' : m)
    ),
    address: initialData?.address ?? '',
  });

  /** URLs of uploaded photos (Supabase Storage) */
  const [uploadedImages, setUploadedImages] = useState(initialData?.images ?? []);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /** Room Form State */
  const getTagValue = (prefix) => {
    const tag = (initialData?.tags || []).find(t => typeof t === 'string' && t.startsWith(prefix));
    return tag ? tag.split(':')[1] : null;
  };
  const [roomType, setRoomType] = useState(getTagValue('ROOM_TYPE') || '1');
  const [totalRooms, setTotalRooms] = useState(parseInt(getTagValue('ROOM_TOTAL') || '2', 10));
  const [residentFemale, setResidentFemale] = useState(parseInt(getTagValue('ROOM_FEMALE') || '0', 10));
  const [residentMale, setResidentMale] = useState(parseInt(getTagValue('ROOM_MALE') || '0', 10));
  const [preferredGender, setPreferredGender] = useState((getTagValue('ROOM_TARGET') || 'ANY').toUpperCase());
  const [rentType, setRentType] = useState((getTagValue('RENT_TYPE') || 'warm').toLowerCase());

  const [propertyFeatures, setPropertyFeatures] = useState(() => {
    return (initialData?.tags || [])
      .filter(t => typeof t === 'string' && t.startsWith('FEATURE:'))
      .map(t => t.split(':')[1]);
  });

  const AVAILABLE_FEATURES = [
    { id: 'ANMELDUNG', label: 'Anmeldung Possible', icon: '📝' },
    { id: 'NO_ANMELDUNG', label: 'Anmeldung Not Possible', icon: '🚫' },
    { id: 'UNDERFLOOR_HEATING', label: 'Underfloor Heating', icon: '♨️' },
    { id: 'CENTRAL_HEATING', label: 'Central Heating', icon: '🌡️' },
    { id: 'ELEVATOR', label: 'Elevator / Lift', icon: '🛗' },
    { id: 'FIBER_INTERNET', label: 'High-Speed Fiber Internet', icon: '⚡' },
    { id: 'WHEELCHAIR_ACCESSIBLE', label: 'Wheelchair Accessible', icon: '♿' },
    { id: 'FITTED_KITCHEN', label: 'Fitted Kitchen', icon: '🍳' },
    { id: 'DISHWASHER', label: 'Dishwasher', icon: '🍽️' },
    { id: 'OVEN_STOVE', label: 'Oven & Stove', icon: '🍲' },
    { id: 'FRIDGE_FREEZER', label: 'Fridge & Freezer', icon: '🧊' },
    { id: 'MICROWAVE', label: 'Microwave', icon: '🍱' },
    { id: 'WASHING_MACHINE', label: 'In-unit Washing Machine', icon: '🌀' },
    { id: 'SHARED_LAUNDRY', label: 'Shared Laundry Room', icon: '👚' },
    { id: 'TUMBLE_DRYER', label: 'Tumble Dryer', icon: '🌬️' },
    { id: 'BATHTUB', label: 'Bathtub', icon: '🛁' },
    { id: 'WALKIN_SHOWER', label: 'Walk-in Shower', icon: '🚿' },
    { id: 'BALCONY', label: 'Balcony', icon: '☀️' },
    { id: 'TERRACE', label: 'Terrace / Deck', icon: '🪴' },
    { id: 'GARDEN', label: 'Private Garden', icon: '🌳' },
    { id: 'UNDERGROUND_PARKING', label: 'Underground Parking', icon: '🅿️' },
    { id: 'OUTDOOR_PARKING', label: 'Outdoor Parking Space', icon: '🚗' },
    { id: 'BICYCLE_STORAGE', label: 'Bicycle Storage', icon: '🚲' },
    { id: 'BASEMENT_STORAGE', label: 'Basement Storage Unit', icon: '📦' },
    { id: 'AIR_CONDITIONING', label: 'Air Conditioning', icon: '❄️' },
    { id: 'FURNISHED', label: 'Furnished', icon: '🛋️' },
    { id: 'SEMI_FURNISHED', label: 'Semi-furnished', icon: '🪑' },
    { id: 'UNFURNISHED', label: 'Unfurnished', icon: '🏠' },
    { id: 'NON_SMOKING', label: 'Non-smoking Household', icon: '🚭' },
    { id: 'PET_FRIENDLY', label: 'Pet Friendly', icon: '🐾' }
  ];

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
    if (!user) return;
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
      const ext = file.name.split('.').pop();
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
   * Removes the photo at the specified index from the list
   * and deletes the file from Supabase Storage.
   *
   * @param {number} index
   */
  const removeImage = async (index) => {
    const imageUrl = uploadedImages[index];
    // Extract storage path from the public URL
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const pathIndex = imageUrl?.indexOf(marker);
    if (pathIndex !== -1 && imageUrl) {
      const storagePath = imageUrl.slice(pathIndex + marker.length);
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    }
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Moves the selected image to the first position (index 0)
   * to set it as the cover photo.
   *
   * @param {number} index
   */
  const setAsCover = (index) => {
    if (index === 0) return;
    setUploadedImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
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

    if (isAccommodation && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('Rent is required for Accommodation ads.');
      setSubmitting(false);
      return;
    }

    const priceNum = formData.price ? parseFloat(formData.price) : 0;
    if (priceNum > 0 && !isAccommodation && (!formData.payment_methods || formData.payment_methods.length === 0)) {
      setError('Please select at least one payment method for paid ads.');
      setSubmitting(false);
      return;
    }

    let computedTags = [];
    if (isAccommodation) {
      computedTags.push(`RENT_TYPE:${rentType.toUpperCase()}`);

      propertyFeatures.forEach(feature => {
        computedTags.push(`FEATURE:${feature}`);
      });

      if (selectedCategoryObj?.slug?.includes('room')) {
        computedTags.push(`ROOM_TYPE:${roomType}`);
        computedTags.push(`ROOM_TOTAL:${totalRooms}`);
        computedTags.push(`ROOM_FEMALE:${residentFemale}`);
        computedTags.push(`ROOM_MALE:${residentMale}`);
        computedTags.push(`ROOM_TARGET:${preferredGender}`);
      }
    }

    const newPrice = formData.price ? parseFloat(formData.price) : null;

    // ── Price history logic ──
    // When the price changes, store the previous price in original_price so the
    // UI can display a strikethrough. If the new price matches the stored
    // original_price the user has reverted, so clear it.
    let originalPrice = initialData?.original_price ?? null;
    if (initialData?.id) {
      const prevPrice = initialData.price ?? null;
      if (newPrice !== prevPrice) {
        // Price changed — capture the old price as original
        originalPrice = prevPrice;
      }
      // If the new price equals the already-stored original, the drop was reverted — clear it
      if (newPrice === originalPrice) {
        originalPrice = null;
      }
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: newPrice,
      original_price: originalPrice,
      currency: DEFAULT_CURRENCY,
      category_id: formData.category_id || null,
      area: isAccommodation ? (parseFloat(formData.area) || null) : null,
      images: uploadedImages,
      payment_methods: formData.payment_methods,
      tags: computedTags,
      address: formData.address.trim(),
      // owner_id is intentionally excluded from updates — the DB owner never changes.
      // For inserts it is set below from the authenticated session only.
    };

    let result;

    if (initialData?.id) {
      // ── Update mode ──
      // Always filter by owner_id for the authenticated user.
      // Supabase RLS admin policy bypasses this filter for admins server-side,
      // so we never rely on the client-side isAdmin flag for authorization.
      result = await supabase
        .from('ads')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', initialData.id)
        .eq('owner_id', user.id)
        .select('serial_number')
        .single();
    } else {
      // ── Creation mode — original_price is always null for new listings ──
      result = await supabase
        .from('ads')
        .insert({ ...payload, original_price: null, owner_id: user.id })
        .select('serial_number')
        .single();
    }

    const { data, error: dbError } = result;

    if (dbError) {
      setError(dbError.message || ERROR_MESSAGES.generic);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    // Invalidate React Query cache so the new/updated ad is visible immediately
    await queryClient.invalidateQueries({ queryKey: ['ads'] });

    // Redirect to ad detail page immediately
    router.push(buildAdUrl(data.serial_number));
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

      {/* ── Room Dynamic Fields ── */}
      {isAccommodation && categories.find(c => c.id === formData.category_id)?.slug?.includes('room') && (
        <div className="border border-brand-100 bg-brand-50/30 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-tertiary pb-4">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <span className="text-2xl">🏠</span> Smart Room-Listing
            </h3>
            <span className="px-3 py-1.5 bg-ink text-white text-xs font-bold rounded-full tracking-wide">
              Single Occupancy Only
            </span>
          </div>

          <div className="space-y-3">
            <label className="label">1. Room Privacy</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${roomType === '1' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-brand-300'}`}>
                <input type="radio" name="roomType" value="1" checked={roomType === '1'} onChange={() => setRoomType('1')} className="hidden" />
                <div className="font-semibold text-ink text-sm">Type 1: Standard</div>
                <div className="text-xs text-ink-secondary mt-1">Shared Bath & Kitchen</div>
              </label>
              <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${roomType === '2' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-brand-300'}`}>
                <input type="radio" name="roomType" value="2" checked={roomType === '2'} onChange={() => setRoomType('2')} className="hidden" />
                <div className="font-semibold text-ink text-sm">Type 2: Comfort</div>
                <div className="text-xs text-ink-secondary mt-1">Private Bath, Shared Kitchen</div>
              </label>
              <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${roomType === '3' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-brand-300'}`}>
                <input type="radio" name="roomType" value="3" checked={roomType === '3'} onChange={() => setRoomType('3')} className="hidden" />
                <div className="font-semibold text-ink text-sm">Type 3: Premium</div>
                <div className="text-xs text-ink-secondary mt-1">Private Bath & Kitchen</div>
              </label>
            </div>
          </div>

          {roomType !== '3' && (
            <>
              <div className="space-y-4 pt-3 border-t border-surface-tertiary">
                <label className="label">2. Apartment Size</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl border border-surface-tertiary">
                  <span className="text-sm font-medium text-ink flex-1">Total Rooms in Apartment:</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setTotalRooms(Math.max(2, totalRooms - 1))} className="w-10 h-10 rounded-full border border-surface-tertiary hover:bg-surface-secondary font-bold text-xl flex items-center justify-center">-</button>
                    <span className="w-8 text-center font-bold text-xl">{totalRooms}</span>
                    <button type="button" onClick={() => setTotalRooms(Math.min(15, totalRooms + 1))} className="w-10 h-10 rounded-full border border-surface-tertiary hover:bg-surface-secondary font-bold text-xl flex items-center justify-center">+</button>
                  </div>
                </div>
                <p className="text-xs text-ink-tertiary px-2 font-medium">✨ This room automatically represents 1 room. The remaining {totalRooms - 1} room(s) represent the rest of the flatmates.</p>
              </div>

              <div className="space-y-4 pt-3 border-t border-surface-tertiary">
                <label className="label">3. Current Flatmates</label>
                <p className="text-xs text-ink-tertiary mb-3 mt-0">Specify the genders of the flatmates living in the other {totalRooms - 1} rooms.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-pink-50/60 p-4 rounded-2xl border border-pink-100 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-pink-600 font-semibold text-sm">🚶‍♀️ Female</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setResidentFemale(Math.max(0, residentFemale - 1))} className="w-9 h-9 rounded-full bg-white border border-pink-200 text-pink-600 font-bold hover:bg-pink-100 flex items-center justify-center text-lg">-</button>
                      <span className="w-5 text-center font-bold text-pink-700 text-lg">{residentFemale}</span>
                      <button type="button" onClick={() => setResidentFemale(Math.min(totalRooms - 1 - residentMale, residentFemale + 1))} className="w-9 h-9 rounded-full bg-white border border-pink-200 text-pink-600 font-bold hover:bg-pink-100 flex items-center justify-center text-lg">+</button>
                    </div>
                  </div>
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-blue-600 font-semibold text-sm">🚶‍♂️ Male</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setResidentMale(Math.max(0, residentMale - 1))} className="w-9 h-9 rounded-full bg-white border border-blue-200 text-blue-600 font-bold hover:bg-blue-100 flex items-center justify-center text-lg">-</button>
                      <span className="w-5 text-center font-bold text-blue-700 text-lg">{residentMale}</span>
                      <button type="button" onClick={() => setResidentMale(Math.min(totalRooms - 1 - residentFemale, residentMale + 1))} className="w-9 h-9 rounded-full bg-white border border-blue-200 text-blue-600 font-bold hover:bg-blue-100 flex items-center justify-center text-lg">+</button>
                    </div>
                  </div>
                </div>
                {(residentFemale + residentMale > totalRooms - 1) && (
                  <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-lg border border-red-100">The total number of flatmates cannot exceed the remaining rooms ({totalRooms - 1}).</p>
                )}
              </div>

              <div className="space-y-4 pt-3 border-t border-surface-tertiary">
                <label className="label">4. Target Tenant Preference</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${preferredGender === 'ANY' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-brand-300'}`}>
                    <input type="radio" name="preferredGender" value="ANY" checked={preferredGender === 'ANY'} onChange={() => setPreferredGender('ANY')} className="hidden" />
                    <div className="font-semibold text-ink text-sm">Any Gender</div>
                    <div className="text-xs text-ink-secondary mt-1">All genders welcome</div>
                  </label>
                  <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${preferredGender === 'FEMALE' ? 'border-pink-500 bg-pink-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-pink-300'}`}>
                    <input type="radio" name="preferredGender" value="FEMALE" checked={preferredGender === 'FEMALE'} onChange={() => setPreferredGender('FEMALE')} className="hidden" />
                    <div className="font-semibold text-pink-700 text-sm">Female Only</div>
                    <div className="text-xs text-pink-600 mt-1">Looking for a female tenant</div>
                  </label>
                  <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${preferredGender === 'MALE' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-surface-tertiary bg-white hover:border-blue-300'}`}>
                    <input type="radio" name="preferredGender" value="MALE" checked={preferredGender === 'MALE'} onChange={() => setPreferredGender('MALE')} className="hidden" />
                    <div className="font-semibold text-blue-700 text-sm">Male Only</div>
                    <div className="text-xs text-blue-600 mt-1">Looking for a male tenant</div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Accomodation Features (Universal for apartments & rooms) ── */}
      {isAccommodation && (
        <div className="border border-brand-100 bg-brand-50/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
          <h3 className="font-bold text-ink flex items-center gap-2 border-b border-surface-tertiary pb-4">
            <span className="text-2xl">✨</span> Property Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
            {AVAILABLE_FEATURES.map(feature => {
              const isSelected = propertyFeatures.includes(feature.id);

              const handleFeatureToggle = (featureId, checked) => {
                let nextFeatures = [...propertyFeatures];
                if (checked) {
                  // Exclusivity Constraints
                  if (featureId === 'UNDERFLOOR_HEATING') {
                    nextFeatures = nextFeatures.filter(id => id !== 'CENTRAL_HEATING');
                  } else if (featureId === 'CENTRAL_HEATING') {
                    nextFeatures = nextFeatures.filter(id => id !== 'UNDERFLOOR_HEATING');
                  } else if (featureId === 'FURNISHED') {
                    nextFeatures = nextFeatures.filter(id => id !== 'SEMI_FURNISHED' && id !== 'UNFURNISHED');
                  } else if (featureId === 'SEMI_FURNISHED') {
                    nextFeatures = nextFeatures.filter(id => id !== 'FURNISHED' && id !== 'UNFURNISHED');
                  } else if (featureId === 'UNFURNISHED') {
                    nextFeatures = nextFeatures.filter(id => id !== 'FURNISHED' && id !== 'SEMI_FURNISHED');
                  } else if (featureId === 'ANMELDUNG') {
                    nextFeatures = nextFeatures.filter(id => id !== 'NO_ANMELDUNG');
                  } else if (featureId === 'NO_ANMELDUNG') {
                    nextFeatures = nextFeatures.filter(id => id !== 'ANMELDUNG');
                  }
                  if (!nextFeatures.includes(featureId)) nextFeatures.push(featureId);
                } else {
                  nextFeatures = nextFeatures.filter(f => f !== featureId);
                }
                setPropertyFeatures(nextFeatures);
              };

              return (
                <label
                  key={feature.id}
                  className={`cursor-pointer p-3 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all border-2
                     ${isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm text-brand-700'
                      : 'border-surface-tertiary bg-white hover:border-brand-300 text-ink-secondary hover:text-ink'
                    }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={(e) => handleFeatureToggle(feature.id, e.target.checked)}
                  />
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-xs font-semibold">{feature.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Title ── */}
      <div>
        <label htmlFor="ad-title" className="label">Title *</label>
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

      {/* ── Address ── */}
      <div>
        <label htmlFor="ad-address" className="label">Address / Location</label>
        <input
          id="ad-address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g. Felsennelkenanger 21, 80937, München"
          maxLength={200}
          className="input"
        />
        <p className="text-[10px] text-ink-tertiary mt-1">
          Provide a clear address to show your ad on the map.
        </p>
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

        {/* ── Price ── */}
        <div>
          <label htmlFor="ad-price" className="label">
            {isAccommodation ? 'Rent' : 'Price'} ({CURRENCY_SYMBOL})
          </label>
          <div className="flex items-center gap-3">
            <input
              id="ad-price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input flex-1"
            />
            {isAccommodation && (
              <div className="flex bg-surface-secondary p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setRentType('warm')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${rentType === 'warm' ? 'bg-white shadow relative text-ink border border-surface-tertiary' : 'text-ink-tertiary hover:text-ink-secondary'}`}
                >
                  Warm
                </button>
                <button
                  type="button"
                  onClick={() => setRentType('cold')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${rentType === 'cold' ? 'bg-white shadow relative text-ink border border-surface-tertiary' : 'text-ink-tertiary hover:text-ink-secondary'}`}
                >
                  Cold
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-tertiary mt-1">Leave empty or write 0 → "Free"</p>
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
            <div key={url} className={cn(
              "relative aspect-square rounded-2xl overflow-hidden group border-2 transition-all",
              index === 0 ? "border-green-500 ring-2 ring-green-100" : "border-transparent"
            )}>
              <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
              
              {/* Cover Indicator */}
              {index === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-10 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  COVER
                </div>
              )}

              {/* Action Buttons Container */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    title="Set as Cover"
                    className="w-8 h-8 rounded-full bg-white text-brand-500 flex items-center justify-center hover:bg-brand-50 transition-colors shadow-lg"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Remove photo"
                  className="w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
