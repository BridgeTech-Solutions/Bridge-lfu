// lib/supabase/client.ts
'use client'

import { useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
  
export function useSupabase() {
  const supabase = useMemo(() => createSupabaseClient(), []);

  return supabase;
}
