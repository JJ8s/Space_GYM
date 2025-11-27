'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';

export default function GymDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [gym, setGym] = useState<any>(null);
  
  const [data, setData] = useState({ fecha: '', hora: '08:00', horas: 1, dias: 1 });

  useEffect(() => {
    if (params.id) gymsService.getGymById(params.id as string).then(setGym);
  }, [params.id]);

  const goToCheckout = () => {
    if (!user) return router.push('/auth');
    if (!data.fecha) return alert("Selecciona una fecha");

    const query = new URLSearchParams({
      gymId: gym.id,
      fecha: data.fecha,
      hora: data.hora,
      horas: data.horas.toString(),
      dias: data.dias.toString()
    }).toString();
    
    router.push(`/dashboard/checkout?${query}`);
  };

  if (!gym) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="h-64 bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-2xl font-bold text-gray-400">
            {gym.name}
          </div>
          <h1 className="text-3xl font-bold">{gym.name}</h1>
          <p className="text-green-600 font-bold text-xl mt-2">${gym.pricePerDay.toLocaleString()}/día</p>
          <p className="text-gray-500 mt-4">{gym.description}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl h-fit">
          <h2 className="font-bold text-lg mb-4">Configura tu reserva</h2>
          <div className="space-y-4">
            <input type="date" className="w-full p-3 border rounded-xl" onChange={e => setData({...data, fecha: e.target.value})} min={new Date().toISOString().split('T')[0]} />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" className="w-full p-3 border rounded-xl" value={data.hora} onChange={e => setData({...data, hora: e.target.value})} />
              <input type="number" className="w-full p-3 border rounded-xl" value={data.horas} min={1} onChange={e => setData({...data, horas: Number(e.target.value)})} />
            </div>
            <button onClick={goToCheckout} className="w-full bg-black text-white py-3 rounded-xl font-bold mt-4">
              Ir a Pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}