import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, datos } = body

    const supabase = await createServerSupabaseClient()

    // Obtener destinatarios
    const { data: destinatarios } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .eq('is_active', true)
      .in('role', ['admin', 'recepcionista'])

    if (datos.barbero_id) {
      const { data: barbero } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', datos.barbero_id)
        .single()

      if (barbero) {
        destinatarios?.push({ 
          email: barbero.email, 
          full_name: barbero.full_name, 
          role: 'barbero' 
        })
      }
    }

    // Guardar notificación (aquí puedes agregar lógica para enviar email real)
    if (tipo === 'nueva_reserva') {
      console.log('Nueva reserva:', datos)
      // Aquí integrarías Resend, SendGrid, etc.
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notificación procesada',
      destinatarios: destinatarios?.map(d => d.email)
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al procesar notificación' },
      { status: 500 }
    )
  }
}