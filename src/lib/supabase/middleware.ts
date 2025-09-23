// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname

  // 1️⃣ Ignorer toutes les routes API
  if (currentPath.startsWith('/api')) {
    return NextResponse.next()
  }

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
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2️⃣ Définir les chemins publics pour le frontend
  const publicPaths = [
    '/login',
    '/register',
    '/reset-password',
    '/verification-pending',
    '/error',
  ]

  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path))

  // 3️⃣ Rediriger si non connecté et chemin privé
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
