"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { gymsService } from '@/lib/supabase/gyms-service';
import Link from 'next/link';
import toast from 'react-hot-toast'; // <--- 1. IMPORTAMOS TOAST

export default function PublishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Verificación de Rol
  useEffect(() => {
    const checkRole = async () => {
      if (authLoading) return;
      if (!user) { router.push('/auth'); return; }
      
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (data?.role === 'deportista') {
        toast.error("Acceso denegado: Solo para Arrendadores"); // <--- Actualizado a Toast
        router.push('/dashboard');
      }
    };
    checkRole();
  }, [user, authLoading, router]);

  // Manejo del Formulario con Toast + Delay
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Casting rápido para obtener los valores del form
    const form = e.target as any;

    try {
        await gymsService.createGym({
            name: form.name.value,
            description: form.description.value,
            location: form.location.value,
            pricePerDay: Number(form.pricePerDay.value),
            amenities: [] // Por ahora vacío, luego puedes agregar checkboxes
        }, user!.id);
        
        // 2. ÉXITO VISUAL
        toast.success("¡Espacio publicado correctamente!");
        
        // 3. DELAY ANTES DE REDIRIGIR
        // Esperamos 1.5 segundos para que el usuario lea el mensaje
        setTimeout(() => {
            router.push('/business');
        }, 1500);

    } catch (e) { 
        console.error(e);
        toast.error("Error al publicar el espacio. Intenta nuevamente.");
    }
    setLoading(false);
  };

  if (authLoading) return <div className="p-10 text-center">Verificando permisos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pt-10">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-sm">
        <div className="flex justify-between mb-6">
            <h1 className="font-bold text-2xl">Publicar Espacio</h1>
            <Link href="/business" className="text-gray-500 hover:text-gray-800">Cancelar</Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre del Gimnasio</label>
              <input name="name" required placeholder="Ej: Power Gym Centro" className="w-full p-3 border rounded-xl mt-1" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descripción</label>
              <textarea name="description" required placeholder="Describe tu espacio..." className="w-full p-3 border rounded-xl mt-1" rows={3} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Precio por Día (CLP)</label>
              <input name="pricePerDay" required type="number" placeholder="Ej: 5000" className="w-full p-3 border rounded-xl mt-1" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ubicación</label>
              <input name="location" required placeholder="Ej: Av. Providencia 1234" className="w-full p-3 border rounded-xl mt-1" />
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
                {loading ? 'Publicando...' : 'Publicar Espacio'}
            </button>
        </form>
      </div>
    </div>
  );
}