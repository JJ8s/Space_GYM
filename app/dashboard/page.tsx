'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useDashboard } from '@/hooks/useDashboard';
import Link from 'next/link';
import GymCard from '@/components/dashboard/GymCard';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const dashboard = useDashboard();

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading, router]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-black italic">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      
      {/* NAVBAR ESTILO INDUSTRIAL */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center transform -skew-x-12">
                <span className="text-white font-bold text-xs skew-x-12">SG</span>
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase">
                SPACE<span className="text-red-600">GYM</span>
            </span>
        </div>

        {/* BUSCADOR */}
        <div className="flex-1 max-w-md w-full relative">
            <input 
                onChange={(e) => dashboard.searchGyms(e.target.value)} 
                className="w-full p-3 pl-10 bg-gray-100 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-black focus:outline-none font-bold placeholder-gray-400 transition-all" 
                placeholder="BUSCAR GIMNASIO..." 
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 items-center">
            <Link 
                href="/dashboard/reservations" 
                className="px-5 py-2 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
            >
                Mis Reservas
            </Link>
            <button 
                onClick={() => { supabase.auth.signOut(); router.push('/'); }} 
                className="px-4 py-2 border-2 border-black text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-black hover:text-white transition-colors"
            >
                Salir
            </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* HERO / TITULO */}
        <div className="mt-8 border-b-2 border-gray-200 pb-6">
            <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-gray-900 mb-2">
                ENCUENTRA <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-black">TU ESPACIO</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                {dashboard.gyms.length} espacios disponibles cerca de ti
            </p>
        </div>

        {/* GRILLA DE GIMNASIOS */}
        {dashboard.gyms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dashboard.gyms.map(gym => (
                    <GymCard key={gym.id} gym={gym} />
                ))}
            </div>
        ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-400 font-bold text-xl uppercase">No se encontraron resultados</p>
            </div>
        )}
      </main>
    </div>
  );
}