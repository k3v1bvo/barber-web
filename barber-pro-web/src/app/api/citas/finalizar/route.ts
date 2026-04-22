import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { cita_id, metodo_pago, propinas } = body

    // Obtener la cita con el cliente_id
    const { data: cita } = await supabase
      .from('citas')
      .select('barbero_id, estado, precio, comision_barbero, cliente_id')
      .eq('id', cita_id)
      .single()

    if (!cita) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const puedeFinalizar = profile?.role === 'admin' || 
                           profile?.role === 'recepcionista' ||
                           (profile?.role === 'barbero' && cita.barbero_id === user.id)

    if (!puedeFinalizar) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (cita.estado !== 'en_proceso') {
      return NextResponse.json({ error: 'La cita no está en proceso' }, { status: 400 })
    }

    const comisionTotal = (cita.comision_barbero || 0) + ((propinas || 0) * 0.5)

    // ✅ ACTUALIZAR CITA Y ESTADÍSTICAS DEL CLIENTE
    const { error: updateCitaError } = await supabase
      .from('citas')
      .update({ 
        estado: 'completado',
        finished_at: new Date().toISOString(),
        metodo_pago,
        propinas: propinas || 0,
        comision_barbero: comisionTotal,
      })
      .eq('id', cita_id)

    if (updateCitaError) {
      return NextResponse.json({ error: updateCitaError.message }, { status: 500 })
    }

    // Actualizar cliente (Lealtad)
    if (cita.cliente_id) {
      const { data: clienteActual } = await supabase
        .from('clientes')
        .select('total_visitas, total_gastado')
        .eq('id', cita.cliente_id)
        .single()

      if (clienteActual) {
        await supabase
          .from('clientes')
          .update({
            total_visitas: (clienteActual.total_visitas || 0) + 1,
            total_gastado: (clienteActual.total_gastado || 0) + cita.precio
          })
          .eq('id', cita.cliente_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al finalizar cita' }, { status: 500 })
  }
}