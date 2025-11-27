export interface ReservationFormData {
  gymId: string;
  fecha: string;
  hora: string;
  horas: number;
  dias: number;
}

export interface Reservation extends ReservationFormData {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface ReservationErrors {
  fecha?: string;
  hora?: string;
  horas?: string;
  dias?: string;
  gym?: string;
}