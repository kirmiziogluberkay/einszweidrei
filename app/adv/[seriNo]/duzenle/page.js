import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdForm from '@/components/ads/AdForm';

export const metadata = { title: 'Edit Ad' };

export default async function AdEditPage({ params }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ad } = await supabase
    .from('ads')
    .select('id, serial_number, title, description, price, currency, images, category_id, owner_id')
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (ad.owner_id !== user.id && profile?.role !== 'admin') {
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
