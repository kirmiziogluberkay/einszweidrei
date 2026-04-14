import { NextResponse }          from 'next/server';
import { readData, writeData }   from '@/lib/github-db';
import { getSession }            from '@/lib/auth-session';

export async function PUT(request, { params }) {
  const session = await getSession();
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { data: cats, sha } = await readData('categories');
  const idx = cats.findIndex(c => c.id === params.id);

  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  cats[idx] = { ...cats[idx], ...body, id: cats[idx].id };
  await writeData('categories', cats, sha);

  return NextResponse.json({ category: cats[idx] });
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: cats, sha } = await readData('categories');
  const next = cats.filter(c => c.id !== params.id);

  if (next.length === cats.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await writeData('categories', next, sha);
  return NextResponse.json({ ok: true });
}
