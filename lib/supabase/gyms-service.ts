import { supabase } from './client';
import { Gym, ScheduleBlock } from '@/lib/types/gym'; 

export const gymsService = {
  // --- LECTURA DE TODOS LOS GIMNASIOS ---
  async getAllGyms(filters?: any): Promise<Gym[]> {
    let query = supabase.from('sport_spaces').select('*');
    
    if (filters?.searchQuery) {
      query = query.ilike('name', `%${filters.searchQuery}%`);
    }
    
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
      amenities: item.amenities || [],
      extraImagesUrls: item.extra_images_urls || [],
      // Leemos el horario, si es null ponemos uno por defecto
      schedule: item.schedule || [{ open: '06:00', close: '23:00' }]
    }));
  },

  // --- LECTURA DE UN GIMNASIO ---
  async getGymById(id: string): Promise<Gym | null> {
    const { data, error } = await supabase
      .from('sport_spaces')
      .select(`
        *,
        profiles:owner_id (
          full_name,
          rut_empresa,
          razon_social,
          is_verified
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      name: data.name,
      pricePerDay: data.price_per_day,
      location: data.location,
      rating: data.rating,
      imageUrl: data.image_url,
      description: data.description,
      amenities: data.amenities || [],
      extraImagesUrls: data.extra_images_urls || [],
      schedule: data.schedule || [{ open: '06:00', close: '23:00' }],
      
      ownerProfile: data.profiles ? {
        full_name: data.profiles.full_name,
        rut_empresa: data.profiles.rut_empresa,
        razon_social: data.profiles.razon_social,
        is_verified: data.profiles.is_verified
      } : undefined
    };
  },

  // --- VERIFICAR DISPONIBILIDAD (Con Debug Mejorado) ---
  async checkAvailability(gymId: string, date: string, startTime: string, hours: number) {
    // 1. Calcular hora de fin exacta
    const [h, m] = startTime.split(':').map(Number);
    const startObj = new Date(); 
    startObj.setHours(h, m, 0);
    
    const endObj = new Date(startObj);
    endObj.setHours(startObj.getHours() + hours); // Sumamos las horas de duración (usualmente calculadas por el bloque)
    
    const endTime = endObj.toTimeString().slice(0, 5); // "18:00"

    // 2. Validar choques con otras reservas (RPC en Base de Datos)
    const { data: isAvailable, error } = await supabase
      .rpc('check_availability', {
        p_gym_id: gymId,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime
      });

    // --- AQUÍ ESTÁ EL CAMBIO SOLICITADO (DEBUG) ---
    if (error) {
        console.error("Detalle del error RPC:", error); // Esto saldrá en tu consola (F12)
        throw new Error(`Error técnico al verificar: ${error.message}`); 
    }

    if (!isAvailable) {
        throw new Error("⚠️ Ya existe una reserva confirmada en este horario.");
    }

    // 3. Validar si el horario solicitado encaja en los BLOQUES de apertura
    const { data: gym } = await supabase
        .from('sport_spaces')
        .select('schedule')
        .eq('id', gymId)
        .single();

    if (gym && gym.schedule) {
        // Buscamos si existe al menos un bloque donde el tiempo solicitado quepa entero
        const isOpen = (gym.schedule as ScheduleBlock[]).some((block) => {
            return startTime >= block.open && endTime <= block.close;
        });

        if (!isOpen) {
            throw new Error(`El gimnasio está cerrado en ese horario. Revisa los bloques disponibles.`);
        }
    }

    return { success: true, endTime };
  },

  // --- CREAR GIMNASIO ---
  async createGym(gymData: any, userId: string) {
    const { data, error } = await supabase
      .from('sport_spaces')
      .insert({
        name: gymData.name,
        description: gymData.description,
        price_per_day: gymData.pricePerDay,
        location: gymData.location,
        amenities: gymData.amenities,
        owner_id: userId,
        image_url: gymData.image_url,
        extra_images_urls: gymData.extraImagesUrls || [],
        schedule: gymData.schedule // Guardamos el array JSON de horarios
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- ACTUALIZAR GIMNASIO ---
  async updateGym(id: string, updates: any) {
    const { data, error } = await supabase
      .from('sport_spaces')
      .update({
        name: updates.name,
        description: updates.description,
        price_per_day: updates.pricePerDay,
        location: updates.location,
        amenities: updates.amenities,
        image_url: updates.imageUrl,
        extra_images_urls: updates.extraImagesUrls,
        schedule: updates.schedule // Actualizamos horarios
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- ELIMINAR GIMNASIO ---
  async deleteGym(id: string) {
    // 1. Borrar historial primero (limpieza)
    const { error: bookingsError } = await supabase.from('bookings').delete().eq('gym_id', id);
    
    if (bookingsError) {
        console.error("Error borrando historial:", bookingsError);
        throw new Error("No se pudo borrar el historial de reservas.");
    }
    
    // 2. Borrar gimnasio
    const { error } = await supabase.from('sport_spaces').delete().eq('id', id);
    if (error) throw error;
  }
};