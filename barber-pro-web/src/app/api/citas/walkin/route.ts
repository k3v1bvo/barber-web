import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombreCliente, emailCliente, telefonoCliente, servicio_id, metodo_pago, propinas } = body

    // 1. Manejar el Cliente
    let clienteId = null
    
    if (emailCliente || telefonoCliente) {
      let query = supabase.from('clientes').select('id, total_visitas, total_gastado')
      if (emailCliente) query = query.eq('email', emailCliente)
      else query = query.eq('telefono', telefonoCliente)
        
      const { data: exCliente } = await query.single()
      
      if (exCliente) {
        clienteId = exCliente.id
      } else {
        // Crear cliente
        const { data: newCliente, error: clError } = await supabase
          .from('clientes')
          .insert({
            nombre: nombreCliente || 'Cliente Walk-in',
            email: emailCliente,
            telefono: telefonoCliente,
            total_visitas: 0,
            total_gastado: 0
          })
          .select('id')
          .single()
          
        if (clError) throw clError
        clienteId = newCliente.id
      }
    }

    // 2. Obtener precio del servicio
    const { data: serv } = await supabase.from('servicios').select('precio').eq('id', servicio_id).single()
    const precioBase = serv?.precio || 0
    const comisionTotal = precioBase * 0.3 + ((propinas || 0) * 0.5) // Asumimos 30% fijo por ahora

    // 3. Crear Cita "Completada" instantánea
    // Simulamos que empezó hace media hora y terminó justo ahora
    const ahora = new Date()
    const inicio = new Date(ahora.getTime() - 30 * 60000)

    const { error: citaError } = await supabase.from('citas').insert({
      cliente_id: clienteId,
      barbero_id: user.id, // El barbero que está cobrando
      servicio_id,
      fecha_hora: inicio.toISOString(),
      finished_at: ahora.toISOString(),
      precio: precioBase,
      duracion_real_minutos: 30,
      estado: 'completado',
      metodo_pago,
      propinas: propinas || 0,
      comision_barbero: comisionTotal,
      notas: 'Venta Rápida (Walk-in)',
    })

    if (citaError) throw citaError

    // 4. Actualizar Lealtad
    if (clienteId) {
      const { data: cData } = await supabase.from('clientes').select('total_visitas, total_gastado').eq('id', clienteId).single()
      if (cData) {
        await supabase.from('clientes')
          .update({
            total_visitas: (cData.total_visitas || 0) + 1,
            total_gastado: (cData.total_gastado || 0) + precioBase
          })
          .eq('id', clienteId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error Walk-in:', error)
    return NextResponse.json({ error: 'Error procesando la venta' }, { status: 500 })
  }
}
