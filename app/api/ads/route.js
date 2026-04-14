/**
 * app/api/ads/route.js
 * GET  /api/ads  — list ads with filters & pagination
 * POST /api/ads  — create a new ad (auth required)
 */

import { NextResponse }          from 'next/server';
import { randomUUID }            from 'crypto';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';
import { ADS_PER_PAGE }          from '@/constants/config';

// ── Helpers ──────────────────────────────────────────

function generateSerialNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result  = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function joinCategory(ad, categories) {
  const cat = categories.find(c => c.id === ad.category_id);
  return cat ? { ...ad, category: { id: cat.id, name: cat.name, slug: cat.slug } } : ad;
}

// ── GET ───────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const page            = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit           = parseInt(searchParams.get('limit') ?? String(ADS_PER_PAGE), 10);
  const categoryId      = searchParams.get('categoryId') ?? null;
  const categoryIds     = searchParams.get('categoryIds')?.split(',').filter(Boolean) ?? null;
  const ownerId         = searchParams.get('ownerId') ?? searchParams.get('owner_id') ?? null;
  const searchQuery     = searchParams.get('q') ?? '';
  const minPrice        = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null;
  const maxPrice        = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null;
  const paymentMethods  = searchParams.get('paymentMethods')?.split(',').filter(Boolean) ?? null;
  const serialNumber    = searchParams.get('serial') ?? null;
  const id              = searchParams.get('id') ?? null;
  const includeAll      = searchParams.get('all') === '1'; // admin: include all statuses

  const [{ data: ads }, { data: categories }] = await Promise.all([
    readData('ads'),
    readData('categories'),
  ]);

  // Single ad lookups
  if (serialNumber) {
    const ad = ads.find(a => a.serial_number === serialNumber);
    if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ad: joinCategory(ad, categories) });
  }

  if (id) {
    const ad = ads.find(a => a.id === id);
    if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ad: joinCategory(ad, categories) });
  }

  // List / filter
  let filtered = [...ads];

  if (!ownerId && !includeAll) {
    filtered = filtered.filter(a => a.status === 'active');
  }

  if (ownerId) {
    filtered = filtered.filter(a => a.owner_id === ownerId);
  }

  if (categoryIds && categoryIds.length > 0) {
    filtered = filtered.filter(a => categoryIds.includes(a.category_id));
  } else if (categoryId) {
    filtered = filtered.filter(a => a.category_id === categoryId);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q)
    );
  }

  if (minPrice !== null) filtered = filtered.filter(a => (a.price ?? 0) >= minPrice);
  if (maxPrice !== null) filtered = filtered.filter(a => (a.price ?? 0) <= maxPrice);

  if (paymentMethods && paymentMethods.length > 0 && paymentMethods.length < 3) {
    const hasFree   = paymentMethods.includes('Free');
    const otherMeth = paymentMethods.filter(m => m !== 'Free');

    filtered = filtered.filter(a => {
      const isFree = !a.price || a.price === 0;
      if (hasFree && isFree) return true;
      if (otherMeth.length > 0 && a.payment_methods?.some(m => otherMeth.includes(m))) return true;
      return false;
    });
  }

  // Sort: newest first, images-first secondary sort
  filtered.sort((a, b) => {
    const aImg = a.images?.length > 0;
    const bImg = b.images?.length > 0;
    if (aImg && !bImg) return -1;
    if (!aImg && bImg) return  1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const total    = filtered.length;
  const from     = (page - 1) * limit;
  const paginated = filtered.slice(from, from + limit);

  const withCategories = paginated.map(ad => joinCategory(ad, categories));

  return NextResponse.json({ ads: withCategories, total, page });
}

// ── POST ──────────────────────────────────────────────

export async function POST(request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data: ads, sha } = await readData('ads');

  // Generate unique serial number
  let serial;
  do {
    serial = generateSerialNumber();
  } while (ads.some(a => a.serial_number === serial));

  const now = new Date().toISOString();
  const ad  = {
    id:              randomUUID(),
    serial_number:   serial,
    title:           body.title?.trim() ?? '',
    description:     body.description?.trim() ?? '',
    price:           body.price ?? null,
    original_price:  null,
    currency:        body.currency ?? 'EUR',
    category_id:     body.category_id ?? null,
    area:            body.area ?? null,
    images:          body.images ?? [],
    status:          'active',
    payment_methods: body.payment_methods ?? [],
    tags:            body.tags ?? [],
    address:         body.address?.trim() ?? '',
    owner_id:        session.user.id,
    created_at:      now,
    updated_at:      now,
  };

  ads.push(ad);
  await writeData('ads', ads, sha);

  return NextResponse.json({ ad }, { status: 201 });
}
