export interface OwnerProfile {
  full_name: string;
  rut_empresa?: string;
  razon_social?: string;
  is_verified?: boolean;
}

// Nueva interfaz para un bloque de horario individual
export interface ScheduleBlock {
  open: string;  // "08:00"
  close: string; // "13:00"
}

export interface Gym {
  id: string;
  name: string;
  pricePerDay: number;
  location: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  amenities: string[];
  extraImagesUrls?: string[];
  ownerProfile?: OwnerProfile;
  
  // Reemplazamos openHour/closeHour simples por un array de bloques
  schedule: ScheduleBlock[]; 
}

export interface GymFilters {
  searchQuery: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}