/**
 * app/api/categories/route.js
 * GET  /api/categories       — list all active categories
 * POST /api/categories       — create category (admin)
 */

import { NextResponse }          from 'next/server';
import { randomUUID }            from 'crypto';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';
import { DEFAULT_CATEGORIES }    from '@/constants/config';

// ── Seed helper ──────────────────────────────────────
async function seedIfEmpty(categories, sha) {
  if (categories.length > 0) return { categories, sha };

  let id = 1;
  const seeded = [];
  for (const parent of DEFAULT_CATEGORIES) {
    const parentId = randomUUID();
    seeded.push({
      id:         parentId,
      name:       parent.name,
      slug:       parent.slug,
      parent_id:  null,
      sort_order: id++,
      is_active:  true,
    });
    for (const child of (parent.children ?? [])) {
      seeded.push({
        id:         randomUUID(),
        name:       child.name,
        slug:       child.slug,
        parent_id:  parentId,
        sort_order: id++,
        is_active:  true,
      });
    }
  }

  const newSha = await writeData('categories', seeded, sha);
  return { categories: seeded, sha: newSha };
}

// ── GET ───────────────────────────────────────────────

export async function GET() {
  let { data: cats, sha } = await readData('categories');

  if (cats.length === 0) {
    const result = await seedIfEmpty(cats, sha);
    cats = result.categories;
  }

  const active = cats.filter(c => c.is_active !== false);
  active.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));

  return NextResponse.json({ categories: active });
}

// ── POST ──────────────────────────────────────────────

export async function POST(request) {
  const session = await getSession();
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { data: cats, sha } = await readData('categories');

  const category = {
    id:         randomUUID(),
    name:       body.name?.trim() ?? '',
    slug:       body.slug?.trim() ?? '',
    parent_id:  body.parent_id ?? null,
    sort_order: body.sort_order ?? cats.length,
    is_active:  body.is_active !== false,
  };

  cats.push(category);
  await writeData('categories', cats, sha);

  return NextResponse.json({ category }, { status: 201 });
}
