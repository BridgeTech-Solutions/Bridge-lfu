'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/client'; // Import the hook directly
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { toast } from 'sonner';

interface CurrentUserHook {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useCurrentUser(): CurrentUserHook {
  // Call the useSupabase hook at the top level
  const supabase = useSupabase(); // This is the fix

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser) {
          setUser(supabaseUser);

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (profileError) {
            console.error('Erreur lors de la récupération du profil:', profileError);
            setProfile(null);
          } else {
            setProfile(profileData as Profile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Logic for real-time updates
      // Note: You may want to call loadUserAndProfile here to update both user and profile
      if (session?.user) {
        setUser(session.user);
        // It's a good practice to re-fetch the profile here to keep it in sync.
        // Or you can create a separate function to handle both.
      } else {
        setUser(null);
        setProfile(null);
          // Affiche une notification lors de la déconnexion
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]); // Add supabase to the dependency array

  return { user, profile, loading };
}