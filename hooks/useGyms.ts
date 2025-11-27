import { useState, useMemo, useEffect } from 'react';
import { Gym, GymFilters } from '@/lib/types';
import { gymsService } from '@/lib/supabase/gyms-service';

export const useGyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filters, setFilters] = useState<GymFilters>({ searchQuery: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGyms = async () => {
    setLoading(true);
    setError(null);
    try {
      const gymsData = await gymsService.getAllGyms(filters);
      setGyms(gymsData);
    } catch (err) {
      setError('Error cargando gimnasios');
      console.error('Error loading gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar gimnasios al inicializar y cuando cambien los filtros
  useEffect(() => {
    loadGyms();
  }, [filters.searchQuery]);

  const filteredGyms = useMemo(() => {
    return gyms;
  }, [gyms]);

  const searchGyms = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  };

  return {
    gyms: filteredGyms,
    loading,
    error,
    filters,
    searchGyms,
    refetch: loadGyms
  };
};