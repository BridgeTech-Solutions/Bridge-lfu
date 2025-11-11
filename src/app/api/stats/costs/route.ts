import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'

// GET /api/stats/costs?period=30&groupBy=editor&client_id=...
// Calcule le coût total des licences expirant dans les N prochains jours, groupé
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })

    const supabase = createSupabaseServerClient()
    const checker = new PermissionChecker(user)
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const period = Math.max(1, Math.min(parseInt(searchParams.get('period') || '30', 10), 365))
    const groupBy = (searchParams.get('groupBy') || 'editor') as 'editor'

    if (clientId && !checker.canViewAllData() && clientId !== user.client_id) {
      return NextResponse.json({ message: 'Vous ne pouvez pas accéder aux statistiques d\'un autre client' }, { status: 403 })
    }

    // Date fin: aujourd'hui + period
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + period)
    const endIso = end.toISOString().slice(0, 10)
    const startIso = now.toISOString().slice(0, 10)

    // Utiliser la vue enrichie si disponible
    let query = supabase.from('v_licenses_with_client').select('editor, supplier_name, cost, expiry_date, client_id')

    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id)
    } else if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Fenêtre: licences expirant dans la période [aujourd'hui, +period]
    query = query.gte('expiry_date', startIso).lte('expiry_date', endIso)

    const { data, error } = await query
    if (error) {
      console.error('Erreur stats coûts:', error)
      return NextResponse.json({ message: 'Erreur lors de la récupération des coûts' }, { status: 500 })
    }

    const rows = (data || []) as Array<{ editor: string | null; supplier_name?: string | null; cost: number | null }>
    const map = new Map<string, number>()
    rows.forEach(r => {
      const key = (groupBy === 'editor' ? (r.supplier_name || r.editor || 'Inconnu') : 'Inconnu') as string
      const val = typeof r.cost === 'number' ? r.cost : parseFloat(String(r.cost || 0)) || 0
      map.set(key, (map.get(key) || 0) + (isNaN(val) ? 0 : val))
    })

    const result = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    return NextResponse.json({
      periodDays: period,
      groupBy,
      data: result,
      filters: { clientId: clientId || (!checker.canViewAllData() ? user.client_id : null) }
    })
  } catch (err) {
    console.error('Erreur API GET /stats/costs:', err)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}


