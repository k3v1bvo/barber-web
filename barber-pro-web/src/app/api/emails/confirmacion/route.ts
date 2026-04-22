import { Resend } from 'resend'
import { NextResponse } from 'next/server'

// Recomendación: Configura tu API KEY en .env.local como RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123')

export async function POST(request: Request) {
  try {
    const { email, nombreCliente, servicio, fecha, hora, nombreBarbero, emailBarbero } = await request.json()

    // 1. Correo para el Barbero (Aviso de nueva cita)
    if (emailBarbero) {
      await resend.emails.send({
        from: 'BarberPro <onboarding@resend.dev>', // Cambiar por dominio propio en producción
        to: emailBarbero,
        subject: `📅 Nueva Reserva: ${nombreCliente}`,
        html: `
          <h1>¡Nueva Cita Agendada!</h1>
          <p>Tienes una nueva reserva para el día <strong>${fecha}</strong> a las <strong>${hora}</strong>.</p>
          <ul>
            <li><strong>Cliente:</strong> ${nombreCliente}</li>
            <li><strong>Servicio:</strong> ${servicio}</li>
          </ul>
          <p>Revisa tu panel para más detalles.</p>
        `
      })
    }

    // 2. Correo para el Cliente (Confirmación)
    if (email) {
      await resend.emails.send({
        from: 'BarberPro <onboarding@resend.dev>',
        to: email,
        subject: '✂️ Tu cita en BarberPro está confirmada',
        html: `
          <h1>¡Hola ${nombreCliente}!</h1>
          <p>Tu cita ha sido agendada con éxito.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 10px;">
            <p><strong>Servicio:</strong> ${servicio}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Hora:</strong> ${hora}</p>
            <p><strong>Barbero:</strong> ${nombreBarbero}</p>
          </div>
          <p>¡Te esperamos!</p>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error enviando email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
