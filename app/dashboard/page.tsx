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

  if (authLoading) return <div>Cargando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="w-full border-b bg-white/90 backdrop-blur p-4 flex justify-between items-center">
        <span className="text-xl font-bold">SpaceGym</span>
        <input onChange={(e) => dashboard.searchGyms(e.target.value)} className="border rounded-full px-4 py-2 w-1/3" placeholder="Buscar..." />
        <div className="flex gap-4 items-center">
            <Link href="/dashboard/reservations" className="text-sm font-bold text-green-600">Mis Reservas</Link>
            <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="text-sm text-red-500">Salir</button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Encuentra tu espacio</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboard.gyms.map(gym => (
                <GymCard key={gym.id} gym={gym} onReserve={() => {}} />
            ))}
        </div>
      </main>
    </div>
  );
}