"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

function GymDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Estado del formulario
  const [form, setForm] = useState({
    fecha: '',
    start: '', // Hora inicio del bloque
    end: '',   // Hora fin del bloque
    duration: 0, 
    dias: 1
  });

  useEffect(() => {
    if (params.id) {
      gymsService.getGymById(params.id as string).then(data => {
        setGym(data);
        setSelectedImage(data?.imageUrl || data?.extraImagesUrls?.[0] || null);
        setLoading(false);
      });
    }
  }, [params.id]);

  // Función al hacer clic en un bloque de horario
  const selectBlock = (open: string, close: string) => {
    // Calculamos duración para guardarla en la reserva
    const startHour = parseInt(open.split(':')[0]);
    const endHour = parseInt(close.split(':')[0]);
    const duration = endHour - startHour;

    setForm(prev => ({
        ...prev,
        start: open,
        end: close,
        duration: duration
    }));
  };

  const handleReserve = async () => {
    if (!user) { router.push('/auth'); return; }
    if (!form.fecha) return toast.error("Selecciona una fecha");
    if (!form.start) return toast.error("Selecciona un bloque de horario");
    
    const loadingToast = toast.loading("Verificando disponibilidad...");

    try {
        await gymsService.checkAvailability(
            gym.id, 
            form.fecha, 
            form.start, 
            form.duration
        );
        
        toast.dismiss(loadingToast);
        toast.success("¡Disponible!");

        const query = new URLSearchParams({
            gymId: gym.id,
            fecha: form.fecha,
            hora: form.start,
            horas: form.duration.toString(),
            dias: form.dias.toString()
        }).toString();
        
        router.push(`/dashboard/checkout?${query}`);

    } catch (error: any) {
        toast.dismiss(loadingToast);
        toast.error(error.message, { duration: 5000, icon: '🚫' });
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Cargando...</div>;
  if (!gym) return <div className="p-10 text-center font-bold">Gimnasio no encontrado</div>;

  const allImages = [gym.imageUrl, ...(gym.extraImagesUrls || [])].filter(Boolean);
  
  // CORRECCIÓN NAN: Nos aseguramos de que el precio sea un número válido
  const price = Number(gym.pricePerDay) || 0;
  const totalPrice = price * form.dias;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pb-20">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DETALLES */}
        <div className="md:col-span-2 space-y-6">
            
            <div className="relative h-96 w-full rounded-3xl overflow-hidden shadow-sm bg-gray-200 border border-gray-200">
                {selectedImage ? (
                    <Image src={selectedImage} alt={gym.name} fill className="object-cover" priority />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-100">Sin Imagen Disponible</div>
                )}
                <Link href="/dashboard" className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-full text-xs font-bold hover:bg-black hover:text-white transition-colors shadow-sm z-10">← Volver</Link>
            </div>

            {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {allImages.map((img: string, index: number) => (
                        <button key={index} onClick={() => setSelectedImage(img)} className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-red-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                            <Image src={img} alt={`Foto ${index}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}

            <div>
                <div className="flex justify-between items-start">
                    <h1 className="text-4xl font-black italic uppercase tracking-tight">{gym.name}</h1>
                    <div className="text-right">
                        <p className="text-red-600 font-black text-2xl">${price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase">Por día</p>
                    </div>
                </div>
                <p className="text-sm font-bold text-gray-500 uppercase mt-2 flex items-center gap-1">📍 {gym.location}</p>

                {gym.ownerProfile && gym.ownerProfile.is_verified && (
                    <div className="bg-white border-l-4 border-black p-4 shadow-sm my-6 rounded-r-lg">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Operado por Empresa Verificada</h3>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">✅</div>
                            <div>
                                <p className="font-bold text-gray-900 uppercase text-sm">{gym.ownerProfile.razon_social || gym.ownerProfile.full_name}</p>
                                <p className="text-xs text-gray-500 font-mono">RUT: {gym.ownerProfile.rut_empresa || 'Validado'}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-lg mb-3">Descripción</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{gym.description}</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-3">Lo que ofrece este lugar</h3>
                <div className="flex flex-wrap gap-3">
                    {gym.amenities.map((amenity: string, i: number) => (
                        <span key={i} className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700">{amenity}</span>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO NUEVO (SIN DURACIÓN) */}
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-6">
                <h3 className="font-black italic text-xl mb-6 uppercase">RESERVAR TURNO</h3>
                
                <div className="space-y-6">
                    {/* 1. FECHA */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">1. Selecciona Fecha</label>
                        <input 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl mt-2 focus:border-black outline-none font-bold"
                            onChange={e => {
                                setForm({...form, fecha: e.target.value, start: '', end: '', duration: 0});
                            }}
                        />
                    </div>
                    
                    {/* 2. BLOQUES DE HORARIO (BOTONES LARGOS) */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                            2. Bloques Disponibles
                        </label>
                        
                        {!form.fecha ? (
                            <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">← Elige una fecha primero</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {/* Mapeamos los horarios definidos por el dueño */}
                                {gym.schedule && gym.schedule.length > 0 ? (
                                    gym.schedule.map((block: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => selectBlock(block.open, block.close)}
                                            className={`w-full py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex justify-between items-center group
                                                ${form.start === block.open 
                                                    ? 'bg-black text-white border-black shadow-md scale-[1.02]' 
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                                                }
                                            `}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>🕒</span>
                                                {block.open} - {block.close}
                                            </span>
                                            {form.start === block.open && <span>✅</span>}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-red-400 border border-red-200 bg-red-50 p-2 rounded">
                                        🚫 Sin horarios disponibles
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN TOTAL (CORREGIDA) */}
                    <div className="pt-6 border-t border-gray-100 mt-2">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-600">Total a Pagar</span>
                            {/* Mostramos el precio calculado seguro */}
                            <span className="font-black text-3xl text-red-600">
                                ${totalPrice.toLocaleString()}
                            </span>
                        </div>
                        
                        <button 
                            onClick={handleReserve} 
                            disabled={!form.start}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg 
                                ${!form.start 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-black text-white hover:bg-gray-800 hover:-translate-y-1'
                                }
                            `}
                        >
                            {form.start ? 'Ir a Pagar' : 'Elige un bloque'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function GymDetailPage() {
    return <Suspense fallback={<div className="p-10 text-center font-bold">Cargando detalles...</div>}><GymDetailContent /></Suspense>;
}