export interface Gym {
  id: string;
  name: string;
  pricePerDay: number;
  location: string;
  rating: number;
  imageUrl?: string;
  description?: string;
  amenities: string[];
}

export interface GymFilters {
  searchQuery: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}