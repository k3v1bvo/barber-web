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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.delete({
            name,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isRecepcionRoute = request.nextUrl.pathname.startsWith('/recepcion')
  const isBarberoRoute = request.nextUrl.pathname.startsWith('/barbero')
  const isReservarRoute = request.nextUrl.pathname.startsWith('/reservar')
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isRegisterPage = request.nextUrl.pathname === '/register'

  // Si no está logueado y trata de acceder a rutas protegidas
  if (!user && (isAdminRoute || isRecepcionRoute || isBarberoRoute || isReservarRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya está logueado y trata de acceder al login/registro
  if (user && (isLoginPage || isRegisterPage)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (profile?.role === 'recepcionista') {
      return NextResponse.redirect(new URL('/recepcion', request.url))
    } else if (profile?.role === 'barbero') {
      return NextResponse.redirect(new URL('/barbero', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/recepcion/:path*',
    '/barbero/:path*',
    '/reservar',
    '/login',
    '/register',
  ],
}