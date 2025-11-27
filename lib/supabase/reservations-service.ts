import { supabase } from './client';
import { Reservation, ReservationFormData } from '@/lib/types';

export const reservationsService = {
  async createReservation(data: ReservationFormData, userId: string): Promise<Reservation> {
    
    // 1. OBTENER DATOS DEL GIMNASIO
    const { data: gymData, error: gymError } = await supabase
      .from('sport_spaces')
      .select('price_per_day, name, location')
      .eq('id', data.gymId)
      .single();

    if (gymError || !gymData) throw new Error('No se encontró el gimnasio seleccionado.');

    // 2. VALIDAR BLOQUEO DE HORARIO (SCRUM-6)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('hora, horas')
      .eq('gym_id', data.gymId)
      .eq('fecha', data.fecha)
      .in('status', ['confirmed', 'completed']);

    if (existingBookings && existingBookings.length > 0) {
      const newStart = parseTimeToMinutes(data.hora);
      const newEnd = newStart + (data.horas * 60);

      for (const booking of existingBookings) {
        const existingStart = parseTimeToMinutes(booking.hora);
        const existingEnd = existingStart + (booking.horas * 60);

        if (newStart < existingEnd && newEnd > existingStart) {
          throw new Error('❌ ESPACIO OCUPADO: Ya existe una reserva en este horario.');
        }
      }
    }

    // 3. INSERTAR RESERVA EN BD
    const totalCalculated = gymData.price_per_day * data.dias * data.horas;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        gym_id: data.gymId,
        fecha: data.fecha,
        hora: data.hora,
        horas: data.horas,
        dias: data.dias,
        total: totalCalculated,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;

    // 4. ENVIAR CORREO DE CONFIRMACIÓN (SCRUM-7)
    // Importante: Esto va DESPUÉS de crear la reserva para tener el ID
    try {
      const { data: userInfo } = await supabase.auth.getUser();
      
      if (userInfo.user?.email) {
        // Llamada al API Route que verificamos en el paso 1
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userInfo.user.email,
            bookingDetails: {
              id: booking.id, // ID real de la reserva
              gymName: gymData.name,
              location: gymData.location,
              fecha: data.fecha,
              hora: data.hora,
              total: booking.total
            }
          })
        });
        console.log("📧 Correo de confirmación enviado.");
      }
    } catch (emailError) {
      console.error("Reserva creada, pero falló el envío de correo:", emailError);
      // No lanzamos error para no asustar al usuario, la reserva ya es válida
    }

    return {
      id: booking.id,
      gymId: booking.gym_id,
      fecha: booking.fecha,
      hora: booking.hora,
      horas: booking.horas,
      dias: booking.dias,
      userId: booking.user_id,
      total: booking.total,
      status: booking.status,
      createdAt: booking.created_at
    };
  },

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    
    return data.map((item: any) => ({
      id: item.id,
      gymId: item.gym_id,
      userId: item.user_id,
      fecha: item.fecha,
      hora: item.hora,
      horas: item.horas,
      dias: item.dias,
      total: item.total,
      status: item.status,
      createdAt: item.created_at
    }));
  }
};

// Función auxiliar para convertir hora "14:30" -> 870 minutos
function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60) + minutes;
}