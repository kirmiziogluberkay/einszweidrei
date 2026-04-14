/**
 * app/api/upload/route.js
 * POST /api/upload
 * Uploads an image to the GitHub image repository.
 * Auth: must be logged in (iron-session).
 */

import { NextResponse } from 'next/server';
import { getSession }   from '@/lib/auth-session';

const GITHUB_API   = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_IMAGE_REPO;
const BRANCH       = 'main';

export async function POST(request) {
  // ── Auth check ───────────��────────────────────────────
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Env check ─────────────────────────────���───────────
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: 'Image upload is not configured. Please set GITHUB_TOKEN and GITHUB_IMAGE_REPO.' },
      { status: 500 }
    );
  }

  // ── Parse file ─────────────────────────────���──────────
  const formData = await request.formData();
  const file     = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG and WebP are accepted' }, { status: 400 });
  }

  // ── Build unique file path ────────────────────────────
  // adId is passed by AdForm so images go into an ad-specific folder.
  // Fall back to userId if not provided (e.g. direct API calls).
  const folderName = formData.get('adId')?.trim() || session.user.id;
  const ext        = file.name.split('.').pop().toLowerCase();
  const fileName   = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath   = `images/${folderName}/${fileName}`;

  // ── Convert to Base64 ─────────────────────────────────
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // ── Commit to GitHub ──────────────────────────────────
  const apiUrl  = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${filePath}`;
  const payload = { message: `upload: ${fileName}`, content: base64, branch: BRANCH };

  const ghRes = await fetch(apiUrl, {
    method:  'PUT',
    headers: {
      Authorization:          `Bearer ${GITHUB_TOKEN}`,
      Accept:                 'application/vnd.github+json',
      'Content-Type':         'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(payload),
  });

  if (!ghRes.ok) {
    const detail = await ghRes.text();
    console.error('GitHub upload failed:', detail);
    return NextResponse.json({ error: 'GitHub upload failed' }, { status: 502 });
  }

  // Images served through the /api/image proxy
  const url = `/api/image/${filePath}`;
  return NextResponse.json({ url });
}
