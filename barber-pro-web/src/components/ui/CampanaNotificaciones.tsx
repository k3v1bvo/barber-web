'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Clock, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leido: boolean
  link: string | null
  created_at: string
}

interface Props {
  userId: string
  userRole: string
}

export function CampanaNotificaciones({ userId, userRole }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notificaciones.filter(n => !n.leido).length

  useEffect(() => {
    fetchNotificaciones()

    // Configurar Realtime
    const channel = supabase
      .channel('realtime_notifs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${userId}` // Filtro directo si es a este usuario (nota: Supabase a veces requiere que el filtro sea simple, pero podemos filtrar en cliente por rol)
        },
        (payload) => {
          setNotificaciones(prev => [payload.new as Notificacion, ...prev])
        }
      )
      .subscribe()

    // Manejar clic fuera para cerrar
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userId, userRole])

  const fetchNotificaciones = async () => {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .or(`user_id.eq.${userId},rol_destino.eq.${userRole}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotificaciones(data)
  }

  const markAsRead = async (id: string) => {
    await supabase.from('notificaciones').update({ leido: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n))
  }

  const markAllAsRead = async () => {
    const unreadIds = notificaciones.filter(n => !n.leido).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase.from('notificaciones').update({ leido: true }).in('id', unreadIds)
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })))
  }

  const handleNotifClick = (notif: Notificacion) => {
    if (!notif.leido) markAsRead(notif.id)
    setIsOpen(false)
    if (notif.link) router.push(notif.link)
  }

  const getIcon = (tipo: string) => {
    switch(tipo) {
      case 'success': return <CheckCircle2 className="text-green-500 w-5 h-5" />
      case 'warning': return <AlertCircle className="text-amber-500 w-5 h-5" />
      default: return <Info className="text-blue-500 w-5 h-5" />
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `Hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours} hr`
    return `Hace ${Math.floor(hours / 24)} d`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-white relative transition-colors"
      >
        <Bell size={20} className={cn(unreadCount > 0 && "text-amber-500")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full text-[9px] font-black shadow-sm shadow-red-500/50 animate-bounce">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-[-60px] sm:right-0 w-[320px] sm:w-[380px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-amber-500" /> Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                <Check size={12} /> Marcar Leídas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                <Bell size={32} className="opacity-20 mb-2" />
                <p className="text-sm font-medium">No tienes notificaciones nuevas</p>
              </div>
            ) : (
              notificaciones.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    "p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 flex gap-3 group",
                    !notif.leido ? "bg-amber-500/5" : "opacity-75 grayscale-[50%]"
                  )}
                >
                  <div className="mt-1 shrink-0 bg-black/50 p-2 rounded-full border border-white/5 group-hover:scale-110 transition-transform">
                    {getIcon(notif.tipo)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className={cn("text-sm font-bold", !notif.leido ? "text-white" : "text-zinc-300")}>
                        {notif.titulo}
                      </p>
                      {!notif.leido && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{notif.mensaje}</p>
                    <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1 font-bold uppercase tracking-wider">
                      <Clock size={10} /> {timeAgo(notif.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-white/5 bg-black/40 text-center">
             <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Barber Pro Notifications</p>
          </div>
        </div>
      )}
    </div>
  )
}
