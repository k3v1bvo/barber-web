import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'recepcionista') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { cliente_id, servicio_id, barbero_id, fecha_hora } = body

    const { data: servicio } = await supabase
      .from('servicios')
      .select('precio, duracion_minutos')
      .eq('id', servicio_id)
      .single()

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const { data: barbero } = await supabase
      .from('profiles')
      .select('comision_porcentaje')
      .eq('id', barbero_id)
      .single()

    const comisionPorcentaje = barbero?.comision_porcentaje || 0
    const comisionBarbero = (servicio.precio * comisionPorcentaje) / 100

    const { data: cita, error } = await supabase
      .from('citas')
      .insert({
        cliente_id,
        servicio_id,
        barbero_id,
        fecha_hora,
        precio: servicio.precio,
        comision_barbero: comisionBarbero,
        duracion_real_minutos: servicio.duracion_minutos,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: cita })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 })
  }
}