import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('ads')
    .select('id, title, status')
    .in('status', ['active', 'reserved', 'rented']);
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(`Found ${data.length} ads as anonymous user:`);
    console.log(data);
  }
}

test();
