import { notFound, redirect } from 'next/navigation';
import { readData }            from '@/lib/github-db';
import { getSessionUser }      from '@/lib/auth-session';
import AdForm                  from '@/components/ads/AdForm';

export const metadata = { title: 'Edit Ad' };

export default async function AdEditPage({ params }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const { data: ads } = await readData('ads');
  const ad = (ads ?? []).find(a => a.serial_number === params.seriNo);

  if (!ad) notFound();

  if (ad.owner_id !== sessionUser.id && sessionUser.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container-app py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Edit Ad</h1>
        <p className="text-ink-secondary mt-1">Serial No: <span className="font-mono font-medium">{ad.serial_number}</span></p>
      </div>
      <div className="card p-6 sm:p-8">
        <AdForm initialData={ad} />
      </div>
    </div>
  );
}
