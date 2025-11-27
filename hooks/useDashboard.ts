import { useState, useEffect } from 'react';
import { useGyms } from './useGyms';
import { useReservations } from './useReservations';
import { Gym, ReservationFormData } from '@/lib/types';

export const useDashboard = () => {
  // Estados de UI
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [modals, setModals] = useState({
    reserveOpen: false,
    howOpen: false,
    offersOpen: false,
    confirmOpen: false
  });
  const [confirmData, setConfirmData] = useState<any>(null);
  const [seconds, setSeconds] = useState(20);

  // Controladores de negocio
  const { gyms, loading: gymsLoading, searchGyms } = useGyms();
  const { createReservation, loading: reservationLoading, errors, setErrors } = useReservations();

  // Abrir modal de reserva
  const openReserveModal = (gym: Gym) => {
    setSelectedGym(gym);
    setModals(prev => ({ ...prev, reserveOpen: true }));
    setErrors({});
  };

  // Cerrar modal de reserva
  const closeReserveModal = () => {
    setModals(prev => ({ ...prev, reserveOpen: false }));
    setSelectedGym(null);
    setErrors({});
  };

  // Procesar reserva
  const handleReservation = async (formData: ReservationFormData, userId: string) => {
    try {
      const reservation = await createReservation(formData, userId);
      
      // Calcular total
      const total = (selectedGym?.pricePerDay || 0) * formData.dias * formData.horas;
      
      setConfirmData({
        lugar: selectedGym?.name,
        fecha: formData.fecha,
        hora: formData.hora,
        horas: formData.horas,
        dias: formData.dias,
        pricePerDay: selectedGym?.pricePerDay,
        total
      });
      
      closeReserveModal();
      setModals(prev => ({ ...prev, confirmOpen: true }));
    } catch (error) {
      console.error('Reservation failed:', error);
    }
  };

  // Controlar temporizador de confirmación
  useEffect(() => {
    if (!modals.confirmOpen) return;
    
    setSeconds(20);
    const interval = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000);
    const timeout = setTimeout(() => setModals(prev => ({ ...prev, confirmOpen: false })), 20000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [modals.confirmOpen]);

  return {
    // Estados del modelo
    gyms,
    
    // Estados de UI
    selectedGym,
    modals,
    confirmData,
    seconds,
    errors,
    
    // Estados de carga
    loading: gymsLoading || reservationLoading,
    
    // Acciones del controlador
    searchGyms,
    openReserveModal,
    closeReserveModal,
    handleReservation,
    
    // Control de UI
    setModals: (updates: Partial<typeof modals>) => 
      setModals(prev => ({ ...prev, ...updates })),
    
    // Setters
    setConfirmData,
    setSeconds
  };
};