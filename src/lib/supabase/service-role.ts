// src/lib/supabase/service-role.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Assurez-vous d'avoir cette variable dans votre .env

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Les variables d\'environnement pour Supabase ne sont pas définies.')
}

export const createSupabaseServiceRoleClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey)
}