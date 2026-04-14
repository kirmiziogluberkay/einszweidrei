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

  const body    = await request.json();
  const updated = {
    ...ads[idx],
    ...body,
    id:       ads[idx].id,
    owner_id: ads[idx].owner_id,  // owner never changes
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
