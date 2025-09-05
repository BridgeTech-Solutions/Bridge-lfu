// import { useMemo } from 'react';
// import { createBrowserClient } from '@supabase/ssr';
  
// export function useSupabase() {
//   const supabase = useMemo(() => createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   ), []);

//   return supabase;
// }
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // clé secrète côté serveur
)
