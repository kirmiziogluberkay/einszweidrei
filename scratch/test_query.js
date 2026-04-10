require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  let q = supabase.from('ads').select('id, title, status, payment_methods, price').in('status', ['active']);
  
  const paymentMethods = ['Cash', 'PayPal'];
  const otherMethodsList = paymentMethods.join(',');
  q = q.or(`price.is.null,price.eq.0,payment_methods.ov.{${otherMethodsList}}`);
  
  const { data, error } = await q;
  if (error) {
    console.error("ERROR from Supabase:", error);
  } else {
    console.log("Success! Data length:", data?.length);
  }
}
test();
