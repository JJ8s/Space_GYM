"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { gymsService } from '@/lib/supabase/gyms-service';
import Link from 'next/link';

export default function PublishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (authLoading) return;
      if (!user) { router.push('/auth'); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'deportista') {
        alert("Solo arrendadores");
        router.push('/dashboard');
      }
    };
    checkRole();
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... lógica de form ...
    // (Asumimos el form data aquí para ahorrar espacio, ya lo tienes en tu versión anterior)
    // ...
    try {
        // Simulación de envío de form
        const form = e.target as any;
        await gymsService.createGym({
            name: form.name.value,
            description: form.description.value,
            location: form.location.value,
            pricePerDay: Number(form.pricePerDay.value),
            amenities: []
        }, user!.id);
        alert("Publicado");
        router.push('/business');
    } catch (e) { console.error(e) }
    setLoading(false);
  };

  if (authLoading) return <div>Verificando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pt-10">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-sm">
        <div className="flex justify-between mb-6">
            <h1 className="font-bold text-2xl">Publicar Espacio</h1>
            <Link href="/business">Cancelar</Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" required placeholder="Nombre" className="w-full p-3 border rounded-xl" />
            <textarea name="description" required placeholder="Descripción" className="w-full p-3 border rounded-xl" />
            <input name="pricePerDay" required type="number" placeholder="Precio" className="w-full p-3 border rounded-xl" />
            <input name="location" required placeholder="Ubicación" className="w-full p-3 border rounded-xl" />
            <button disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">
                {loading ? '...' : 'Publicar'}
            </button>
        </form>
      </div>
    </div>
  );
}