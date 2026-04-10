import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', 'd0a7d2b6-9f0e-4f02-a75f-59d77cda9052');

    return NextResponse.json({ success: true, data, error });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
