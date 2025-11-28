"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // 1. Recuperar datos de la URL
  const gymId = searchParams.get('gymId');
  const fecha = searchParams.get('fecha');
  const hora = searchParams.get('hora') || '09:00';     
  
  // Validaciones de seguridad para números
  const horasRaw = Number(searchParams.get('horas'));
  const horas = horasRaw > 0 ? horasRaw : 1; 
  
  const diasRaw = Number(searchParams.get('dias'));
  const dias = diasRaw > 0 ? diasRaw : 1;

  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 2. Cargar información del gimnasio
  useEffect(() => {
    if (gymId) {
      gymsService.getGymById(gymId).then(data => {
        setGym(data);
        setLoading(false);
      });
    }
  }, [gymId]);

  // 3. LÓGICA DE PAGO
  const handlePayment = async () => {
    if (!user || !gym) return;
    setProcessing(true);
    
    const loadingToast = toast.loading("Contactando con el banco...");

    try {
        // A) SIMULACIÓN DE PAGO
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Calcular hora de término
        const [h, m] = hora.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(h + horas);
        endDate.setMinutes(m);
        const endTime = endDate.toTimeString().slice(0, 5); 

        const totalCalculado = gym.pricePerDay * dias;

        // B) GUARDAR EN BASE DE DATOS (SUPER BLINDADO)
        // Enviamos el dato duplicado con diferentes nombres de columna
        // para asegurarnos de que coincida con lo que tu base de datos espera.
        const { error } = await supabase
            .from('bookings')
            .insert({
                gym_id: gymId,
                user_id: user.id,
                fecha: fecha,
                
                // --- TIEMPO ---
                start_time: hora, 
                end_time: endTime,
                hora: hora,       // Legacy
                horas: horas,     // Duración
                dias: dias,       // Días

                // --- DINERO (LA CORRECCIÓN) ---
                total_price: totalCalculado, // Nombre nuevo
                total: totalCalculado,       // Nombre antiguo (Este faltaba)
                // ------------------------------

                status: 'confirmed'
            });

        if (error) {
            console.error("Error detallado Supabase:", error);
            throw new Error(`Error BD: ${error.message}`);
        }

        // C) ÉXITO
        toast.dismiss(loadingToast);
        toast.success("✅ ¡Pago Aprobado!", { duration: 4000 });
        
        setTimeout(() => {
            router.push('/dashboard/reservations');
        }, 1000);

    } catch (error: any) {
        console.error(error);
        toast.dismiss(loadingToast);
        toast.error(`${error.message || 'No se pudo procesar'}`);
        setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Cargando checkout...</div>;
  if (!gym) return <div className="min-h-screen flex items-center justify-center">Error: Datos inválidos</div>;

  const totalDisplay = gym.pricePerDay * dias;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>

        <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Confirmar Pago</h1>
            <p className="text-gray-400 text-sm font-bold mt-1">Simulación de Pasarela de Pago</p>
        </div>

        {/* TICKET DE RESUMEN */}
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6 space-y-4 relative">
            <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white rounded-full border-r-2 border-gray-200"></div>
            <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white rounded-full border-l-2 border-gray-200"></div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-xs font-bold uppercase">Gimnasio</span>
                <span className="font-black text-lg text-right">{gym.name}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs font-bold uppercase">Fecha</span>
                <span className="font-bold text-sm">{fecha}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs font-bold uppercase">Horario</span>
                <span className="font-bold text-sm">
                    {hora} - {(parseInt(hora.split(':')[0]) + horas).toString().padStart(2,'0')}:{hora.split(':')[1]} 
                    <span className="text-gray-400 font-normal ml-1">({horas}h)</span>
                </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-gray-900 font-bold uppercase">Total a Pagar</span>
                <span className="text-4xl font-black text-red-600 tracking-tight">${totalDisplay.toLocaleString()}</span>
            </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="space-y-3">
            <button 
                onClick={handlePayment} 
                disabled={processing}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2
                    ${processing 
                        ? 'bg-gray-800 text-gray-400 cursor-wait' 
                        : 'bg-black text-white hover:bg-gray-900 hover:-translate-y-1'
                    }
                `}
            >
                {processing ? (
                    <>
                        <span className="animate-spin">⏳</span> Procesando...
                    </>
                ) : (
                    '💳 Confirmar y Pagar'
                )}
            </button>
            
            <Link 
                href={`/dashboard/gym/${gymId}`} 
                className={`block w-full text-center py-3 text-gray-400 font-bold text-xs uppercase hover:text-black transition-colors ${processing ? 'pointer-events-none opacity-50' : ''}`}
            >
                Cancelar
            </Link>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-300 uppercase font-bold">Ambiente de Pruebas Seguro</p>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}