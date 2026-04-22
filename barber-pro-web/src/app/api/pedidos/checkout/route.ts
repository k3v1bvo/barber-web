import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123')

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  
  try {
    const body = await request.json()
    const { clienteData, cart, metodo_entrega, notas } = body
    
    // 1. Manejar Cliente (Buscar o Crear)
    let clienteId = null
    let emailAEnviar = clienteData.email

    if (clienteData.usuario_registrado_id) {
      clienteId = clienteData.usuario_registrado_id
    } else if (clienteData.email || clienteData.telefono) {
      // Buscar si existe un perfil/cliente con ese correo o teléfono
      let query = supabase.from('clientes').select('id')
      if (clienteData.email) query = query.eq('email', clienteData.email)
      else query = query.eq('telefono', clienteData.telefono)
        
      const { data: exCliente } = await query.single()
      
      if (exCliente) {
        clienteId = exCliente.id
      } else {
        // Crear cliente "shadow" (solo registro de negocio, no Auth)
        const { data: newCliente, error: clError } = await supabase
          .from('clientes')
          .insert({
            nombre: clienteData.nombre,
            email: clienteData.email,
            telefono: clienteData.telefono,
            total_visitas: 0,
            total_gastado: 0
          })
          .select('id')
          .single()
          
        if (clError) throw clError
        clienteId = newCliente.id
      }
    }

    if (!clienteId) {
       return NextResponse.json({ error: 'Se requiere información del cliente válida' }, { status: 400 })
    }

    // 2. Calcular Totales y Crear Pedido
    let total = 0
    for (const item of cart) {
      total += (item.precio_venta * item.cantidad)
    }

    const { data: pedidoNuevo, error: pedError } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        metodo_entrega,
        total,
        estado: 'pendiente'
      })
      .select('id')
      .single()

    if (pedError) throw pedError

    // 3. Crear Items del Pedido y Descontar Stock
    for (const item of cart) {
      await supabase.from('pedido_items').insert({
        pedido_id: pedidoNuevo.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_venta
      })
      
      // Restar stock
      const { data: pActual } = await supabase.from('productos').select('stock_actual').eq('id', item.id).single()
      if (pActual) {
        await supabase.from('productos')
          .update({ stock_actual: pActual.stock_actual - item.cantidad })
          .eq('id', item.id)
      }
    }

    // 4. Correos Electrónicos
    let metodoTxt = ''
    if (metodo_entrega === 'con_reserva') metodoTxt = 'Recoger en el local (junto con mi cita)'
    else if (metodo_entrega === 'recoger') metodoTxt = 'Pasar a recoger hoy'
    else metodoTxt = 'Envío a Domicilio (Pago Cte)'

    // Aviso al Store/Admin
    await resend.emails.send({
      from: 'BarberPro Store <onboarding@resend.dev>',
      to: 'dany3l.11@gmail.com', // FIXME: Debería ser dinámico desde settings, usaré placeholder
      subject: `🛍️ Nuevo Pedido: ${clienteData.nombre}`,
      html: `
        <h1>¡Tienes un nuevo pedido!</h1>
        <p><strong>Cliente:</strong> ${clienteData.nombre}</p>
        <p><strong>Teléfono:</strong> ${clienteData.telefono}</p>
        <p><strong>Método de Entrega:</strong> ${metodoTxt}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p>Revisa el panel de Pedidos para más detalles.</p>
      `
    })

    // Confirmación al Cliente
    if (emailAEnviar) {
      await resend.emails.send({
        from: 'BarberPro Store <onboarding@resend.dev>',
        to: emailAEnviar,
        subject: `Tu pedido está en proceso`,
        html: `
          <h1>¡Hola ${clienteData.nombre}!</h1>
          <p>Hemos recibido tu pedido correctamente.</p>
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p><strong>Método seleccionado:</strong> ${metodoTxt}</p>
          ${metodo_entrega === 'envio' ? '<p>Nos pondremos en contacto contigo enseguida para coordinar el motorizado. Recuerda que el envío se paga al recibir el producto.</p>' : '<p>Te esperamos en la barbería.</p>'}
        `
      })
    }

    return NextResponse.json({ success: true, pedidoId: pedidoNuevo.id })
  } catch (error: any) {
    console.error('Error Checkout:', error)
    return NextResponse.json({ error: 'Error procesando el pedido' }, { status: 500 })
  }
}
