/**
 * app/api/ads/[id]/route.js
 * GET    /api/ads/:id  — fetch single ad by id
 * PUT    /api/ads/:id  — update ad (owner or admin)
 * DELETE /api/ads/:id  — delete ad (owner or admin)
 */

import { NextResponse }          from 'next/server';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

export async function GET(_req, { params }) {
  const { data: ads }        = await readData('ads');
  const { data: categories } = await readData('categories');

  const ad = ads.find(a => a.id === params.id);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cat = categories.find(c => c.id === ad.category_id);
  return NextResponse.json({ ad: { ...ad, category: cat ?? null } });
}

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: ads, sha } = await readData('ads');
  const idx = ads.findIndex(a => a.id === params.id);

  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isOwner = ads[idx].owner_id === session.user.id;
  const isAdmin = session.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Whitelist — users can only update these fields
  const ALLOWED_FIELDS = [
    'title', 'description', 'price', 'original_price',
    'currency', 'category_id', 'area', 'images',
    'payment_methods', 'tags', 'address',
  ];
  // Admins can additionally update status
  if (isAdmin) ALLOWED_FIELDS.push('status');

  const patch = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key];
  }

  const updated = {
    ...ads[idx],
    ...patch,
    id:         ads[idx].id,        // immutable
    owner_id:   ads[idx].owner_id,  // immutable
    serial_number: ads[idx].serial_number, // immutable
    created_at: ads[idx].created_at,       // immutable
    updated_at: new Date().toISOString(),
  };

  ads[idx] = updated;
  await writeData('ads', ads, sha);

  return NextResponse.json({ ad: updated });
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: ads, sha } = await readData('ads');
  const ad = ads.find(a => a.id === params.id);

  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = ad.owner_id === session.user.id;
  const isAdmin = session.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const next = ads.filter(a => a.id !== params.id);
  await writeData('ads', next, sha);

  return NextResponse.json({ ok: true });
}
