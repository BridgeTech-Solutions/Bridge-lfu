
// Solution 2: Si vous voulez garder un type de retour explicite

// import { createServerClient, type SupabaseClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// import type { Database } from '@/types/database'

// export const createSupabaseServerClient = (): SupabaseClient<Database> => {
//   return createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         async get(name: string) {
//           return (await cookies()).get(name)?.value
//         },
//         async set(name: string, value: string, options) {
//           try {
//             (await cookies()).set({ name, value, ...options })
//           } catch {
//             // Ignore cookie errors in production
//           }
//         },
//         async remove(name: string, options) {
//           try {
//             (await cookies()).set({ name, value: '', ...options })
//           } catch {
//             // Ignore cookie errors in production
//           }
//         }
//       }
//     }
//   )
// }


// Solution 3: Avec tous les paramètres génériques explicites

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSupabaseServerClient = (): SupabaseClient<Database, 'public', any> => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value
        },
        async set(name: string, value: string, options) {
          try {
            (await cookies()).set({ name, value, ...options })
          } catch {
            // Ignore cookie errors in production
          }
        },
        async remove(name: string, options) {
          try {
            (await cookies()).set({ name, value: '', ...options })
          } catch {
            // Ignore cookie errors in production
          }
        }
      }
    }
  )
}
