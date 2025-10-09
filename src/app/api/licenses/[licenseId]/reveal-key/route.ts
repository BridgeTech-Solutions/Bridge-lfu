import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'

const bodySchema = z.object({
  password: z.string().min(8)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: NextRequest, context : any) {
  try {
    const user = await getCurrentUser()
    const params = await context.params; 
    const { licenseId } = params;
    if (!user) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })

    const { password } = bodySchema.parse(await request.json())

    const supabase = createSupabaseServerClient()
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user?.email) return NextResponse.json({ message: 'Profil incomplet' }, { status: 400 })

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.user.email,
      password
    })
    if (signInError) return NextResponse.json({ message: 'Mot de passe invalide' }, { status: 403 })

    const checker = new PermissionChecker(user)
    const { data: license, error } = await supabase
      .from('licenses')
      .select('id, license_key, client_id')
      .eq('id',licenseId)
      .single()

    if (error || !license) return NextResponse.json({ message: 'Licence introuvable' }, { status: 404 })
    if (!checker.can('read', 'licenses', license)) return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

    // Journalisation
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'reveal_license_key',
      table_name: 'licenses',
      record_id: license.id,
      metadata: { ip: request.headers.get('x-forwarded-for')?.split(',')[0] ?? null }
    })

    return NextResponse.json({ licenseKey: license.license_key })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Erreur reveal-key:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}