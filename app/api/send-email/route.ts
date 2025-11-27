import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, bookingDetails } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Space Gym <onboarding@resend.dev>',
      to: [email], 
      subject: '¡Reserva Confirmada! - Space Gym',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #78BE20;">¡Tu reserva está lista! 🏋️‍♂️</h1>
          <p>Tu espacio ha sido reservado exitosamente.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 10px;">
            <p><strong>Gimnasio:</strong> ${bookingDetails.gymName}</p>
            <p><strong>Fecha:</strong> ${bookingDetails.fecha} - ${bookingDetails.hora}</p>
            <p><strong>Total:</strong> $${bookingDetails.total}</p>
            <p><strong>ID Reserva:</strong> ${bookingDetails.id}</p>
          </div>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}