const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

async function checkAds() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env = dotenv.parse(envContent);
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data, error, count } = await supabase
    .from('ads')
    .select('id, title, status', { count: 'exact' });
    
  if (error) {
    console.error('Error fetching ads:', error);
    return;
  }
  
  console.log('Total ads in DB:', count);
  console.log('Ads breakdown by status:');
  const stats = {};
  data.forEach(ad => {
    stats[ad.status] = (stats[ad.status] || 0) + 1;
  });
  console.log(stats);
  console.log('Sample ads:', data.slice(0, 5));
}

checkAds();
