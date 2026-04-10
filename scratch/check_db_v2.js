const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

async function checkAds() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env = dotenv.parse(envContent);
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data, error, count } = await supabase
    .from('ads')
    .select('id, title, status, payment_methods, price', { count: 'exact' });
    
  if (error) {
    console.error('Error fetching ads:', error);
    return;
  }
  
  console.log('Total ads in DB:', count);
  const stats = {};
  data.forEach(ad => {
    stats[ad.status] = (stats[ad.status] || 0) + 1;
  });
  console.log('Status stats:', stats);
  
  const paymentStats = { hasMethods: 0, noMethods: 0, freePrice: 0 };
  data.forEach(ad => {
    if (ad.payment_methods && ad.payment_methods.length > 0) paymentStats.hasMethods++;
    else paymentStats.noMethods++;
    if (!ad.price || ad.price == 0) paymentStats.freePrice++;
  });
  console.log('Payment stats:', paymentStats);
  
  console.log('Sample ads with details:');
  data.slice(0, 10).forEach(ad => {
    console.log(`- [${ad.status}] ${ad.title} | Price: ${ad.price} | Methods: ${ad.payment_methods}`);
  });
}

checkAds();
