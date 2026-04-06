/**
 * app/ilan/[seriNo]/duzenle/page.js
 * ─────────────────────────────────────────────────────
 * İlan düzenleme sayfası.
 * Mevcut ilan verisi server'dan çekilip forma aktarılır.
 * ─────────────────────────────────────────────────────
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdForm from '@/components/ads/AdForm';

export const metadata = { title: 'İlanı Düzenle' };

export default async function IlanDuzenlemePage({ params }) {
  const supabase = await createClient();

  // Mevcut kullanıcıyı al
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // İlanı çek
  const { data: ad } = await supabase
    .from('ads')
    .select('id, serial_number, title, description, price, currency, images, category_id, owner_id, payment_methods, tags')
    .eq('serial_number', params.seriNo)
    .single();

  if (!ad) notFound();

  // Sadece ilan sahibi veya admin düzenleyebilir
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
        <h1 className="text-3xl font-bold text-ink">İlanı Düzenle</h1>
        <p className="text-ink-secondary mt-1">Seri No: <span className="font-mono font-medium">{ad.serial_number}</span></p>
      </div>
      <div className="card p-6 sm:p-8">
        <AdForm initialData={ad} />
      </div>
    </div>
  );
}
