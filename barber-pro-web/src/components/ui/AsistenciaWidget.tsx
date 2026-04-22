'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Clock, Play, Square, Loader2 } from 'lucide-react'

export function AsistenciaWidget() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [asistencia, setAsistencia] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<string>('00:00:00')
  
  const supabase = createClient()

  useEffect(() => {
    checkStatus()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (asistencia && !asistencia.hora_salida && asistencia.hora_entrada) {
      interval = setInterval(() => {
        const start = new Date(asistencia.hora_entrada).getTime()
        const now = new Date().getTime()
        const diff = now - start
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTiempoTranscurrido(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [asistencia])

  const checkStatus = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const hoy = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('asistencias')
        .select('*')
        .eq('profile_id', user.id)
        .eq('fecha', hoy)
        .single()

      if (data) {
        setAsistencia(data)
      }
    } catch (error) {
      console.error('Error fetching asistencia', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntrada = async () => {
    if (!userId) return
    setSubmitting(true)
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('asistencias')
        .insert({
          profile_id: userId,
          fecha: hoy,
          hora_entrada: new Date().toISOString(),
        })
        .select()
        .single()
        
      if (error) throw error
      setAsistencia(data)
    } catch (error: any) {
      alert('Error registrando entrada: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSalida = async () => {
    if (!asistencia) return
    setSubmitting(true)
    try {
      const now = new Date()
      const entrada = new Date(asistencia.hora_entrada)
      const horas = (now.getTime() - entrada.getTime()) / (1000 * 60 * 60)
      
      const { data, error } = await supabase
        .from('asistencias')
        .update({
          hora_salida: now.toISOString(),
          horas_trabajadas: horas.toFixed(2)
        })
        .eq('id', asistencia.id)
        .select()
        .single()
        
      if (error) throw error
      setAsistencia(data)
    } catch (error: any) {
      alert('Error registrando salida: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-white/5 animate-pulse">
        <CardContent className="p-6 h-[140px] flex items-center justify-center">
           <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const estado = !asistencia ? 'ausente' : (!asistencia.hora_salida ? 'presente' : 'finalizado')

  return (
    <Card className={`border-none shadow-xl transition-all ${estado === 'presente' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-white/5'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${estado === 'presente' ? 'text-amber-500 animate-pulse' : 'text-zinc-500'}`} />
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Asistencia</h3>
          </div>
          {estado === 'presente' && (
            <span className="text-amber-500 font-mono font-bold tracking-wider">{tiempoTranscurrido}</span>
          )}
        </div>
        
        {estado === 'ausente' && (
          <div>
            <p className="text-zinc-400 text-xs mb-4">Aún no has marcado tu entrada hoy.</p>
            <Button 
              onClick={handleEntrada} 
              disabled={submitting}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
            >
              {submitting ? '...' : <><Play className="w-4 h-4 mr-2" /> Marcar Entrada</>}
            </Button>
          </div>
        )}

        {estado === 'presente' && (
          <div>
            <p className="text-zinc-400 text-xs mb-4">
              En turno desde: <span className="text-white font-bold">{new Date(asistencia.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            <Button 
              onClick={handleSalida} 
              disabled={submitting}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
            >
              {submitting ? '...' : <><Square className="w-4 h-4 mr-2 fill-white" /> Marcar Salida</>}
            </Button>
          </div>
        )}

        {estado === 'finalizado' && (
          <div>
            <p className="text-zinc-400 text-xs mb-2">Turno finalizado.</p>
            <div className="flex justify-between text-xs bg-black/20 p-2 rounded-lg">
               <span className="text-zinc-500 font-bold uppercase tracking-widest">Horas registradas</span>
               <span className="text-amber-500 font-black">{asistencia.horas_trabajadas} h</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
