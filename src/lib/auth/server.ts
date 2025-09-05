import { createSupabaseServerClient } from '@/lib/supabase/server'; // <--- CORRECTION ICI
import type { Profile } from '@/types';

// Récupérer l'utilisateur actuel depuis le serveur
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Erreur dans getCurrentUser:', error);
    return null;
  }
}
