"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';
import { reservationsService } from '@/lib/supabase/reservations-service';

function CheckoutContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [gym, setGym] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const gymId = searchParams.get('gymId');
  const fecha = searchParams.get('fecha');
  const hora = searchParams.get('hora');
  const horas = Number(searchParams.get('horas'));
  const dias = Number(searchParams.get('dias'));

  useEffect(() => {
    if (gymId) gymsService.getGymById(gymId).then(setGym);
  }, [gymId]);

  const handlePayment = async () => {
    if (!user || !gymId) return;
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1000)); // Simular espera
      await reservationsService.createReservation({ gymId, fecha: fecha!, hora: hora!, horas, dias }, user.id);
      alert("✅ ¡Pago exitoso! Reserva guardada y correo enviado.");
      router.push('/dashboard/reservations');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!gym) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Confirmar Pago</h2>
        <p className="mb-4 text-gray-600">Estás reservando <strong>{gym.name}</strong></p>
        <div className="bg-gray-100 p-4 rounded-xl mb-6 text-sm">
          <p>Fecha: {fecha} a las {hora}</p>
          <p>Total: ${(gym.pricePerDay * dias * horas).toLocaleString()}</p>
        </div>
        <button onClick={handlePayment} disabled={processing} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
          {processing ? 'Procesando...' : 'Simular Pago Exitoso'}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div>Cargando...</div>}><CheckoutContent /></Suspense>;
}