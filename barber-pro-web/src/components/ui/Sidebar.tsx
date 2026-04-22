'use client'

import { usePathname } from 'next/navigation'
import { 
  Calendar, 
  Scissors, 
  Package, 
  Users, 
  BarChart3,
  LayoutDashboard,
  Home,
  User,
  Camera,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const adminItems = [
    { label: 'Agenda', href: role === 'admin' || role === 'recepcionista' ? '/recepcion' : '/barbero', icon: Calendar },
    { label: 'Venta / POS', href: '/reservar', icon: ShoppingBag },
    { label: 'Servicios', href: '/admin/servicios', icon: Scissors },
    { label: 'Inventario', href: '/admin/productos', icon: Package },
    { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { label: 'Portafolio', href: '/admin/portafolio', icon: Camera },
    { label: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
  ]

  const clienteItems = [
    { label: 'Mis Citas', href: '/cliente', icon: Calendar },
    { label: 'Reservar', href: '/reservar', icon: Scissors },
    { label: 'Tienda', href: '/tienda', icon: ShoppingBag },
    { label: 'Galería', href: '/galeria', icon: Camera },
  ]

  // Selección de menú basada en rol con tipado automático
  const navItems = role === 'cliente' ? clienteItems : (role ? adminItems : [])

  const isActive = (href: string) => pathname === href

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-zinc-950 border-r border-white/5 h-screen sticky top-0">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 text-amber-500 font-black text-2xl tracking-tighter glow-amber">
          <Scissors className="w-8 h-8" />
          <span>BARBER PRO</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        <p className="px-4 text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] mb-4">
          {role === 'cliente' ? 'Tu Área Personal' : 'Gestión Principal'}
        </p>
        
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all btn-press",
              isActive(item.href) 
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={20} className={cn(isActive(item.href) ? "text-black" : "text-amber-500/70")} />
            {item.label}
          </Link>
        ))}

        <div className="pt-8 pb-4">
           <p className="px-4 text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] mb-4">Navegación</p>
           <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all"
          >
            <Home size={20} />
            Inicio Público
          </Link>
        </div>
      </nav>

      <div className="p-4">
         <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-400 mb-1">
              {role === 'cliente' ? 'Club de Lealtad' : '¿Necesitas ayuda?'}
            </p>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {role === 'cliente' 
                ? 'Acumula puntos por cada visita y canjea promociones exclusivas.' 
                : 'Consulta la guía de usuario o contacta a soporte técnico.'}
            </p>
         </div>
      </div>
    </aside>
  )
}

