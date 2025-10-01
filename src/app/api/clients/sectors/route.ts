import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server';

export async function GET() {
  try {

    // Vérifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }
    const supabase = await createSupabaseServerClient()

    // Récupérer les secteurs distincts depuis la table clients
    const { data: sectors, error } = await supabase
      .from('clients')
      .select('sector')
      .not('sector', 'is', null)
      .order('sector')

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des secteurs' },
        { status: 500 }
      )
    }

    // Extraire les secteurs uniques
    const uniqueSectors = [...new Set(sectors.map(item => item.sector))].filter(Boolean)

    return NextResponse.json(uniqueSectors)
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}