import { useState } from 'react';
import { Reservation, ReservationFormData, ReservationErrors } from '@/lib/types';
import { reservationsService } from '@/lib/supabase/reservations-service';

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ReservationErrors>({});

  const validateReservation = (data: ReservationFormData): boolean => {
    const newErrors: ReservationErrors = {};
    
    if (!data.fecha) newErrors.fecha = "Es obligatorio rellenar esto";
    if (!data.hora) newErrors.hora = "Es obligatorio rellenar esto";
    if (!data.horas || data.horas < 1) newErrors.horas = "Horas inválidas";
    if (!data.dias || data.dias < 1) newErrors.dias = "Días inválidos";
    if (!data.gymId) newErrors.gym = "Es obligatorio elegir un gimnasio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createReservation = async (reservationData: ReservationFormData, userId: string) => {
    if (!validateReservation(reservationData)) {
      throw new Error('Validación fallida');
    }

    setLoading(true);
    setError(null);
    try {
      const newReservation = await reservationsService.createReservation(reservationData, userId);
      setReservations(prev => [newReservation, ...prev]);
      return newReservation;
    } catch (err) {
      const errorMsg = 'Error creando reserva';
      setError(errorMsg);
      console.error(errorMsg, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadUserReservations = async (userId: string) => {
    setLoading(true);
    try {
      const userReservations = await reservationsService.getUserReservations(userId);
      setReservations(userReservations);
    } catch (err) {
      setError('Error cargando reservas');
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    reservations,
    loading,
    error,
    errors,
    createReservation,
    loadUserReservations,
    setErrors
  };
};