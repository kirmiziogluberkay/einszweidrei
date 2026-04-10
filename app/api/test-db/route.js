import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { data: ads, error } = await supabase
      .from('ads')
      .select('id, serial_number, title, tags, category_id')
      .not('tags', 'is', null) // Fetch ads where tags is not null
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ads });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
