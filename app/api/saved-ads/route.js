/**
 * app/api/saved-ads/route.js
 * GET    /api/saved-ads          — get saved ad IDs (or full ads with ?full=1)
 * POST   /api/saved-ads          — save an ad
 * DELETE /api/saved-ads?adId=X   — unsave an ad
 */

import { NextResponse }          from 'next/server';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

export async function GET(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ savedIds: [], savedAds: [] });

  const { searchParams } = new URL(request.url);
  const full  = searchParams.get('full') === '1';
  const uid   = session.user.id;

  const { data: saved } = await readData('saved_ads');
  const mine  = saved.filter(s => s.user_id === uid);
  const ids   = mine.map(s => s.ad_id);

  if (!full) return NextResponse.json({ savedIds: ids });

  // Return full ad objects
  const { data: ads }        = await readData('ads');
  const { data: categories } = await readData('categories');

  const fullAds = mine
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(s => {
      const ad = ads.find(a => a.id === s.ad_id);
      if (!ad) return null;
      const cat = categories.find(c => c.id === ad.category_id);
      return { ...ad, category: cat ?? null };
    })
    .filter(Boolean);

  return NextResponse.json({ savedIds: ids, savedAds: fullAds });
}

export async function POST(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { adId } = await request.json();
  if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });

  const { data: saved, sha } = await readData('saved_ads');
  const uid = session.user.id;

  if (saved.find(s => s.user_id === uid && s.ad_id === adId)) {
    return NextResponse.json({ ok: true }); // already saved
  }

  saved.push({ user_id: uid, ad_id: adId, created_at: new Date().toISOString() });
  await writeData('saved_ads', saved, sha);

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const adId = searchParams.get('adId');
  const uid  = session.user.id;

  const { data: saved, sha } = await readData('saved_ads');
  const next = saved.filter(s => !(s.user_id === uid && s.ad_id === adId));
  await writeData('saved_ads', next, sha);

  return NextResponse.json({ ok: true });
}
