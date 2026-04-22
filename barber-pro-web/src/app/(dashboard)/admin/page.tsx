'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Scissors, 
  DollarSign, 
  Package, 
  Calendar,
  BarChart3,
  Camera,
  ShoppingBag,
  ArrowRight,
  Clock
} from 'lucide-react'
import { AsistenciaWidget } from '@/components/ui/AsistenciaWidget'

interface Stats {
  ventasHoy: number
  citasHoy: number
  clientesTotal: number
  productosStockBajo: number
}

interface Cita {
  id: string
  estado: string
  precio: number
  clientes?: { nombre: string }
  barberos?: { full_name: string }
  servicios?: { nombre: string }
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    ventasHoy: 0,
    citasHoy: 0,
    clientesTotal: 0,
    productosStockBajo: 0,
  })
  const [citasRecientes, setCitasRecientes] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const hoy = new Date().toISOString().split('T')[0]

      const { data: ventasData } = await supabase
        .from('citas')
        .select('precio')
        .eq('estado', 'completado')
        .gte('fecha_hora', `${hoy}T00:00:00`)
        .lte('fecha_hora', `${hoy}T23:59:59`)

      const ventasHoy = ventasData?.reduce((acc: number, v: { precio: number }) => acc + v.precio, 0) || 0

      const { count: citasHoy } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_hora', `${hoy}T00:00:00`)
        .lte('fecha_hora', `${hoy}T23:59:59`)

      const { count: clientesTotal } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      const { data: productosStock } = await supabase
        .from('productos')
        .select('id')
        .lte('stock_actual', 5)

      const { data: citasRecientesData } = await supabase
        .from('citas')
        .select(`
          id,
          estado,
          precio,
          clientes (nombre),
          barberos (full_name),
          servicios (nombre)
        `)
        .gte('fecha_hora', `${hoy}T00:00:00`)
        .order('fecha_hora', { ascending: false })
        .limit(10)

      setStats({
        ventasHoy,
        citasHoy: citasHoy || 0,
        clientesTotal: clientesTotal || 0,
        productosStockBajo: productosStock?.length || 0,
      })

      setCitasRecientes(citasRecientesData as unknown as Cita[] || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pendiente: 'warning',
      confirmado: 'info',
      en_proceso: 'info',
      completado: 'success',
      cancelado: 'danger',
    }
    return variants[estado] || 'default'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-white uppercase leading-none">
            Admin <span className="text-amber-500">Console</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-3 text-lg">Resumen global de operaciones y rendimiento</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" size="md">Historial Completo</Button>
           <Button variant="primary" size="md" className="shadow-lg shadow-amber-500/20 font-black uppercase tracking-wider">Configuración</Button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-amber-500 text-black border-none glow-amber">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-black/60">Ventas de Hoy</p>
                <p className="text-4xl font-black mt-2 leading-none">{formatCurrency(stats.ventasHoy)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-black/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Servicios Hoy</p>
                <p className="text-4xl font-black text-white mt-2 leading-none">{stats.citasHoy}</p>
              </div>
              <Calendar className="w-10 h-10 text-zinc-800" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Base de Clientes</p>
                <p className="text-4xl font-black text-white mt-2 leading-none">{stats.clientesTotal}</p>
              </div>
              <Users className="w-10 h-10 text-zinc-800" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.productosStockBajo > 0 ? "bg-red-500/10 border-red-500/20" : "bg-zinc-900 border-white/5"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={stats.productosStockBajo > 0 ? "text-red-400 text-[10px] font-black uppercase tracking-widest" : "text-zinc-500 text-[10px] font-black uppercase tracking-widest"}>Stock Alerta</p>
                <p className={stats.productosStockBajo > 0 ? "text-4xl font-black text-red-500 mt-2 leading-none" : "text-4xl font-black text-white mt-2 leading-none"}>{stats.productosStockBajo}</p>
              </div>
              <Package className={stats.productosStockBajo > 0 ? "w-10 h-10 text-red-500/40" : "w-10 h-10 text-zinc-800"} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Menu */}
      <div className="space-y-4">
        <h2 className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.3em] ml-1">Módulos de Gestión</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: 'Usuarios', icon: Users, href: '/admin/usuarios' },
            { label: 'Servicios', icon: Scissors, href: '/admin/servicios' },
            { label: 'Inventario', icon: Package, href: '/admin/productos' },
            { label: 'Pedidos', icon: ShoppingBag, href: '/admin/pedidos' },
            { label: 'Portafolio', icon: Camera, href: '/admin/portafolio' },
            { label: 'Reportes', icon: BarChart3, href: '/admin/reportes' },
            { label: 'Asistencia', icon: Clock, href: '/admin/asistencia' },
          ].map((item) => (
            <button 
              key={item.href} 
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center gap-3 h-32 bg-zinc-900 border border-white/5 rounded-2xl hover:border-amber-500/40 transition-all hover:bg-amber-500/5 btn-press group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                 <item.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-white/5">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <CardTitle className="text-lg">📅 Actividad de Citas (Hoy)</CardTitle>
              <Button variant="ghost" size="sm" className="text-amber-500 font-bold" onClick={() => router.push('/recepcion')}>
                Ver Agenda <ArrowRight size={14} className="ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Cliente</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Servicio / Barbero</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Monto</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasRecientes.map((cita) => (
                      <tr key={cita.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-5 px-6">
                           <p className="font-bold text-white group-hover:text-amber-500 transition-colors">{cita.clientes?.nombre || 'Consumidor Final'}</p>
                           <p className="text-[10px] text-zinc-500 font-medium">Ref: {cita.id.substring(0,8)}</p>
                        </td>
                        <td className="py-5 px-6">
                           <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-300 uppercase">{cita.servicios?.nombre || 'General'}</span>
                              <span className="text-zinc-500">|</span>
                              <span className="text-sm font-medium text-zinc-400">{cita.barberos?.full_name || 'No asignado'}</span>
                           </div>
                        </td>
                        <td className="py-5 px-6 text-right">
                           <p className="text-lg font-black text-amber-500 tracking-tighter">{formatCurrency(cita.precio)}</p>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <Badge variant={getEstadoBadge(cita.estado)} className="uppercase font-black text-[10px] tracking-widest px-3">
                            {cita.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {citasRecientes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                           <Calendar size={48} className="mx-auto text-zinc-800 mb-4 opacity-30" />
                           <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Aún no hay actividad registrada hoy</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <AsistenciaWidget />
           <Card className="bg-gradient-to-br from-zinc-900 to-black border-white/5">
              <CardHeader>
                <CardTitle className="text-sm">🔔 Alertas Críticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                 {stats.productosStockBajo > 0 ? (
                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-1">Stock bajo detectado</p>
                      <p className="text-sm text-zinc-400 leading-relaxed">Hay <span className="text-white font-bold">{stats.productosStockBajo} productos</span> que necesitan reposición inmediata.</p>
                      <Button variant="outline" size="sm" className="w-full mt-4 border-red-500/20 text-red-400 hover:bg-red-500/10 uppercase font-black text-[10px]" onClick={()=>router.push('/admin/productos')}>Gestionar Inventario</Button>
                   </div>
                 ) : (
                   <div className="text-center py-8 opacity-30">
                      <Package size={32} className="mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase">Todo en orden</p>
                   </div>
                 )}
              </CardContent>
           </Card>

           <Card className="border-white/5">
              <CardContent className="p-6">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                       <BarChart3 size={24}/>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tip del Mes</p>
                       <p className="text-sm font-bold text-white">Incrementar retención</p>
                    </div>
                 </div>
                 <p className="text-xs text-zinc-500 leading-relaxed mb-6">Ofrece packs de mantenimiento para que tus clientes vuelvan cada 15 días en lugar de 30.</p>
                 <Button variant="outline" size="sm" className="w-full uppercase font-black text-[10px] h-10 tracking-widest">Ver Estrategias</Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}