'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Calendar as CalendarIcon, Users, Filter, Download } from 'lucide-react'

interface AsistenciaRecord {
  id: string
  fecha: string
  hora_entrada: string
  hora_salida: string | null
  horas_trabajadas: number | null
  profiles: {
    full_name: string | null
    role: string
  }
}

export default function AsistenciaReportesPage() {
  const [loading, setLoading] = useState(true)
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAsistencias()
  }, [fecha])

  const loadAsistencias = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Verificar si es admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        return router.push('/')
      }

      const { data, error } = await supabase
        .from('asistencias')
        .select(`
          id, fecha, hora_entrada, hora_salida, horas_trabajadas,
          profiles (full_name, role)
        `)
        .eq('fecha', fecha)
        .order('hora_entrada', { ascending: false })

      if (error) throw error

      setAsistencias((data as any) || [])
    } catch (error) {
      console.error('Error cargando asistencias:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarCSV = () => {
    const cabeceras = ['Empleado', 'Rol', 'Fecha', 'Entrada', 'Salida', 'Horas']
    const filas = asistencias.map(a => [
      a.profiles?.full_name || 'Desconocido',
      a.profiles?.role || 'N/A',
      a.fecha,
      new Date(a.hora_entrada).toLocaleTimeString('es-MX'),
      a.hora_salida ? new Date(a.hora_salida).toLocaleTimeString('es-MX') : 'En turno',
      a.horas_trabajadas || '0'
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + cabeceras.join(",") + "\n" 
      + filas.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asistencia_${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/admin')} className="p-4 hover:bg-white/5 border border-white/5 bg-zinc-950 rounded-2xl transition-all btn-press group">
             <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-amber-500" />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
              Control de <span className="text-amber-500">Asistencia</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-2 text-lg">Monitorea el ingreso y salida del personal</p>
          </div>
        </div>
        <Button variant="outline" size="lg" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-black uppercase tracking-widest h-14 px-8" onClick={exportarCSV}>
          <Download className="w-5 h-5 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-amber-500/10 bg-zinc-900/40">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Fecha de Consulta</label>
              <input
                type="date"
                className="h-12 w-48 border border-white/10 bg-zinc-950 rounded-xl px-4 text-sm font-bold text-white focus:border-amber-500/50 outline-none transition-all"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="lg" className="h-12 uppercase tracking-widest font-black" onClick={loadAsistencias}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-white/5 bg-zinc-900 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-950/50">
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Empleado</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Fecha</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Entrada</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Salida</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Total Horas</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <Clock className="w-12 h-12 mx-auto text-amber-500 animate-spin mb-4" />
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando registros...</p>
                    </td>
                  </tr>
                ) : asistencias.map((registro) => (
                    <tr key={registro.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 px-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-black">
                             {registro.profiles?.full_name?.charAt(0) || 'U'}
                           </div>
                           <div>
                             <p className="font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{registro.profiles?.full_name}</p>
                             <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{registro.profiles?.role}</p>
                           </div>
                         </div>
                      </td>
                      <td className="py-6 px-6">
                         <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm font-bold text-zinc-300">{registro.fecha}</span>
                         </div>
                      </td>
                      <td className="py-6 px-6 text-center">
                         <p className="text-lg font-black text-white">{new Date(registro.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="py-6 px-6 text-center">
                         {registro.hora_salida ? (
                           <p className="text-lg font-black text-white">{new Date(registro.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                         ) : (
                           <span className="text-zinc-600 font-medium italic">-</span>
                         )}
                      </td>
                      <td className="py-6 px-6 text-center">
                         {registro.horas_trabajadas ? (
                           <p className="text-lg font-black text-amber-500">{registro.horas_trabajadas} h</p>
                         ) : (
                           <span className="text-zinc-600 font-medium italic">-</span>
                         )}
                      </td>
                      <td className="py-6 px-6 text-center">
                        <Badge variant={registro.hora_salida ? 'default' : 'success'} className="uppercase font-black text-[10px] tracking-widest px-3">
                           {registro.hora_salida ? 'Turno Finalizado' : 'En Turno'}
                        </Badge>
                      </td>
                    </tr>
                ))}
                {!loading && asistencias.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <Users className="w-16 h-16 mx-auto text-zinc-800 mb-4 opacity-30" />
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No hay registros de asistencia para esta fecha</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
