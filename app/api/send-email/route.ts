import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializamos Resend con tu clave
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log("📨 INTENTANDO ENVIAR CORREO...");

  try {
    const body = await request.json();
    const { gymName, date, time, total, userEmail } = body;

    console.log("📦 Datos:", { gymName, userEmail });

    // ENVIAR CORREO
    const { data, error } = await resend.emails.send({
      // REMITENTE: Debe ser este para pruebas gratuitas
      from: 'SpaceGym <onboarding@resend.dev>', 
      
      // DESTINATARIO: En modo prueba, esto SOLO funciona si userEmail es jordysoli964@gmail.com
      to: [userEmail], 
      
      subject: '✅ ¡Reserva Confirmada! - SpaceGym',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h1 style="color: #000;">¡Listo! Reserva Confirmada</h1>
          <p>Hola, gracias por usar <strong>SpaceGym</strong>.</p>
          <hr/>
          <p>🏋️ <strong>Gimnasio:</strong> ${gymName}</p>
          <p>📅 <strong>Fecha:</strong> ${date}</p>
          <p>⏰ <strong>Hora:</strong> ${time}</p>
          <p>💰 <strong>Total:</strong> $${total}</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Presenta este correo o tu QR al llegar.</p>
        </div>
      `,
    });

    if (error) {
        console.error("❌ Error Resend:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("✅ Correo enviado:", data);
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('❌ Error Servidor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}