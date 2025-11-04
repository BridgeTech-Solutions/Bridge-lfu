import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'

// GET /api/stats/equipment/trends - Obsolescence équipements sur 12 mois (compte par mois)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const checker = new PermissionChecker(user)
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (clientId && !checker.canViewAllData() && clientId !== user.client_id) {
      return NextResponse.json({ message: 'Vous ne pouvez pas accéder aux statistiques d\'un autre client' }, { status: 403 })
    }

    let query = supabase
      .from('equipment')
      .select('estimated_obsolescence_date, client_id')

    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id)
    } else if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erreur récupération tendances équipements:', error)
      return NextResponse.json({ message: 'Erreur lors de la récupération des tendances' }, { status: 500 })
    }

    const items = (data || []).filter((e) => !!e.estimated_obsolescence_date)

    // Construire 12 mois à partir de maintenant
    const months: Array<{ month: string; year: number; key: string; count: number }> = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const label = d.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      const key = `${d.getFullYear()}-${d.getMonth()}`
      months.push({ month: label, year: d.getFullYear(), key, count: 0 })
    }

    // Compter les équipements par mois d'obsolescence
    items.forEach((e) => {
      const d = new Date(e.estimated_obsolescence_date as unknown as string)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = months.find((m) => m.key === key)
      if (bucket) bucket.count++
    })

    // Réponse simple
    return NextResponse.json({
      months: months.map(({ month, count }) => ({ month, count })),
      filters: { clientId: clientId || (!checker.canViewAllData() ? user.client_id : null) }
    })
  } catch (err) {
    console.error('Erreur API GET /stats/equipment/trends:', err)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}


