"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';
import { reservationsService } from '@/lib/supabase/reservations-service';
import toast from 'react-hot-toast'; // <--- IMPORTAR

function CheckoutContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [gym, setGym] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // ... (Recuperación de params igual que antes) ...
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
    
    // Toast de carga
    const loadingToast = toast.loading("Procesando pago...");

    try {
      await new Promise(r => setTimeout(r, 1500)); // Simular proceso de pago
      
      await reservationsService.createReservation({ 
        gymId, fecha: fecha!, hora: hora!, horas, dias 
      }, user.id);

      // ÉXITO: Cambiamos el toast de carga a éxito
      toast.dismiss(loadingToast);
      toast.success("¡Pago exitoso! Reserva confirmada.", { duration: 4000 });
      
      // --- EL DELAY ANTES DEL REDIRECT ---
      setTimeout(() => {
        router.push('/dashboard/reservations');
      }, 2000); // Espera 2 segundos para que el usuario lea el mensaje

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Error: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!gym) return <div className="p-10 text-center">Cargando...</div>;

  // ... (El return del JSX se mantiene igual) ...
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
         {/* ... resto del JSX ... */}
         <button onClick={handlePayment} disabled={processing} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
           {processing ? 'Procesando...' : 'Pagar y Reservar'}
         </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div>Cargando...</div>}><CheckoutContent /></Suspense>;
}