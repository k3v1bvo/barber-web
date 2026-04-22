'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LogOut, 
  User, 
  Menu, 
  X, 
  Users, 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Package, 
  Home,
  BarChart3,
  ShoppingBag,
  Bell,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CampanaNotificaciones } from './CampanaNotificaciones'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url?: string
}

export function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, avatar_url')
          .eq('id', authUser.id)
          .single()

        setUser(profile as UserProfile)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      recepcionista: 'Recepción',
      barbero: 'Barbero',
      cliente: 'Cliente'
    }
    return roles[role] || role
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  const adminNavItems = [
    { label: 'Agenda', href: user?.role === 'admin' || user?.role === 'recepcionista' ? '/recepcion' : '/barbero', icon: Calendar },
    { label: 'Venta', href: '/reservar', icon: ShoppingBag },
    { label: 'Servicios', href: '/admin/servicios', icon: Scissors },
    { label: 'Inventario', href: '/admin/productos', icon: Package },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Portafolio', href: '/admin/portafolio', icon: Camera },
    { label: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
  ]

  const clienteNavItems = [
    { label: 'Mis Citas', href: '/cliente', icon: Calendar },
    { label: 'Reservar', href: '/reservar', icon: Scissors },
    { label: 'Tienda', href: '/tienda', icon: ShoppingBag },
    { label: 'Galería', href: '/galeria', icon: Camera },
  ]

  const navItems = user?.role === 'cliente' ? clienteNavItems : adminNavItems

  const isActive = (href: string) => pathname === href

  if (loading) {
    return (
      <header className="h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
         <div className="flex items-center gap-3 text-amber-500 font-black tracking-tighter animate-pulse">
            <Scissors className="w-6 h-6" />
            <span>BARBER PRO</span>
         </div>
      </header>
    )
  }

  return (
    <>
      {/* --- DESKTOP TOP HEADER --- */}
      <header className="hidden lg:flex h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 text-amber-500 font-black text-xl tracking-tighter hover:scale-105 transition-transform">
            <Scissors className="w-6 h-6 glow-amber" />
            <span>BARBER PRO</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {user ? (
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                    isActive(item.href) 
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))
            ) : (
              <div className="flex items-center gap-6 text-zinc-400 font-medium">
                <Link href="/galeria" className="hover:text-amber-400 transition-colors">Galería</Link>
                <Link href="/tienda" className="hover:text-amber-400 transition-colors">Tienda</Link>
                <Link href="/reservar" className="hover:text-amber-400 transition-colors">Reservar Cita</Link>
              </div>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <CampanaNotificaciones userId={user.id || ''} userRole={user.role} />
              
              <div className="h-8 w-px bg-white/10 mx-2" />

              <div className="flex items-center gap-3 pl-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-white leading-tight">{user.full_name}</p>
                  <p className="text-[10px] uppercase font-black text-amber-500/80 tracking-widest">{getRoleLabel(user.role)}</p>
                </div>
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-amber-400 font-black hover:border-amber-500/50 transition-colors overflow-hidden"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </button>
              </div>

              {/* Account Dropdown (Simplified) */}
              {menuOpen && (
                <div className="absolute top-16 right-8 w-48 bg-zinc-900 border border-white/10 p-2 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
                   <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm"
                   >
                     <LogOut size={16} /> Cerrar Sesión
                   </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-6 py-2 text-zinc-300 hover:text-white font-bold transition-colors">Login</Link>
              <Link href="/register" className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-full transition-all shadow-lg shadow-amber-500/10 active:scale-95">Registro</Link>
            </div>
          )}
        </div>
      </header>

      {/* --- MOBILE TOP BAR --- */}
      <header className="lg:hidden h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 text-amber-500 font-black tracking-tighter">
          <Scissors className="w-6 h-6 glow-amber" />
          <span>BARBER PRO</span>
        </Link>
        {user ? (
           <CampanaNotificaciones userId={user.id || ''} userRole={user.role} />
        ) : (
           <div className="w-10"></div>
        )}
      </header>

      {/* --- MOBILE BOTTOM NAV (UX Essential) --- */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl flex items-center justify-around z-50 backdrop-blur-lg">
        {user ? (
          navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-90",
                isActive(item.href) ? "text-amber-500 font-black" : "text-zinc-500"
              )}
            >
              <item.icon size={22} className={cn(isActive(item.href) && "glow-amber")} />
              <span className="text-[10px] uppercase font-black mt-1 tracking-tighter">{item.label.split('/')[0]}</span>
            </Link>
          ))
        ) : (
          <>
            <Link href="/" className="flex flex-col items-center justify-center text-amber-500"><Home size={22} /><span className="text-[10px] uppercase font-black mt-1">Inicio</span></Link>
            <Link href="/galeria" className="text-zinc-500"><Scissors size={22} /></Link>
            <Link href="/tienda" className="text-zinc-500"><ShoppingBag size={22} /></Link>
            <Link href="/login" className="text-zinc-500"><User size={22} /></Link>
          </>
        )}
      </nav>
    </>
  )
}