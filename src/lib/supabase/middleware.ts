//src//lib/supabase/middlware
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Définir les chemins publics qui ne nécessitent pas d'authentification
  const publicPaths = [
    '/login',
    '/auth',
    '/error',
    '/register',
    '/reset-password',
    '/verification-pending',
    '/api'
  ];

  const currentPath = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

  // Si l'utilisateur n'est pas connecté et que le chemin n'est pas public, rediriger vers la page de connexion
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
