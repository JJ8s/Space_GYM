import { supabase } from './client';
import { Reservation, ReservationFormData, Gym } from '@/lib/types';

export const gymsService = {
  // --- LECTURA ---
  async getAllGyms(filters?: any): Promise<Gym[]> {
    let query = supabase.from('sport_spaces').select('*');
    if (filters?.searchQuery) query = query.ilike('name', `%${filters.searchQuery}%`);
    
    const { data, error } = await query;
    if (error) return [];

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      pricePerDay: item.price_per_day,
      location: item.location,
      rating: item.rating,
      imageUrl: item.image_url,
      description: item.description,
      amenities: item.amenities || []
    }));
  },

  async getGymById(id: string): Promise<Gym | null> {
    const { data, error } = await supabase.from('sport_spaces').select('*').eq('id', id).single();
    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      pricePerDay: data.price_per_day,
      location: data.location,
      rating: data.rating,
      imageUrl: data.image_url,
      description: data.description,
      amenities: data.amenities || []
    };
  },

  // --- ESCRITURA (CREAR) ---
  async createGym(gymData: any, userId: string) {
    const { data, error } = await supabase
      .from('sport_spaces')
      .insert({
        name: gymData.name,
        description: gymData.description,
        price_per_day: gymData.pricePerDay,
        location: gymData.location,
        amenities: gymData.amenities,
        owner_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- ACTUALIZAR (NUEVO) ---
  async updateGym(id: string, updates: any) {
    const { data, error } = await supabase
      .from('sport_spaces')
      .update({
        name: updates.name,
        description: updates.description,
        price_per_day: updates.pricePerDay,
        location: updates.location,
        amenities: updates.amenities
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- ELIMINAR (NUEVO) ---
  async deleteGym(id: string) {
    const { error } = await supabase
      .from('sport_spaces')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};