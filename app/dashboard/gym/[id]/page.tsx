"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gymsService } from '@/lib/supabase/gyms-service';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GymDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados del formulario de reserva
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(1);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (params.id) {
      gymsService.getGymById(params.id as string).then(data => {
        setGym(data);
        setLoading(false);
      });
    }
  }, [params.id]);

  const handleReserve = async () => {
    if (!user) {
        toast.error("Debes iniciar sesión para reservar");
        router.push('/auth');
        return;
    }
    if (!date || !time) {
        toast.error("Selecciona fecha y hora");
        return;
    }

    setChecking(true);
    try {
        // 1. Verificar disponibilidad REAL en base de datos
        await gymsService.checkAvailability(gym.id, date, time, hours);
        
        // 2. Si pasa, ir al Checkout
        const query = new URLSearchParams({
            gymId: gym.id,
            fecha: date,
            hora: time,
            horas: hours.toString(),
            dias: "1" // Por defecto 1 día
        }).toString();
        
        router.push(`/dashboard/checkout?${query}`);

    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setChecking(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic">CARGANDO GYM...</div>;
  if (!gym) return <div className="min-h-screen flex items-center justify-center">Gimnasio no encontrado</div>;

  // Lógica de visualización
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(gym.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const gpsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.location)}`;
  
  const imageSrc = gym.imageUrl || gym.image_url; // Todoterreno
  const rating = Number(gym.rating) || 0;
  const isNew = rating === 0;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans text-gray-900">
      
      {/* --- HERO IMAGE (FOTO GIGANTE) --- */}
      <div className="relative h-[50vh] w-full bg-gray-900">
        {imageSrc ? (
            <Image 
                src={imageSrc} 
                alt={gym.name} 
                fill 
                className="object-cover opacity-60"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl grayscale opacity-20">🏋️</span>
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
            <div className="max-w-7xl mx-auto">
                {/* ETIQUETA DE ESTADO (NUEVO vs RATING) */}
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 inline-block shadow-sm ${isNew ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {isNew ? '🌱 Espacio Nuevo' : `★ ${rating} • Verificado`}
                </span>

                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-black leading-none mb-2 drop-shadow-sm">
                    {gym.name}
                </h1>
                <p className="text-xl font-bold text-gray-600 uppercase flex items-center gap-2">
                    📍 {gym.location}
                </p>
            </div>
        </div>
        
        {/* Botón Volver Flotante */}
        <Link href="/dashboard" className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full font-bold uppercase text-xs hover:bg-white hover:text-black transition-all">
            ← Volver
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
        
        {/* --- COLUMNA IZQUIERDA: DETALLES --- */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* Descripción */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter border-b-4 border-black inline-block mb-6">Sobre el Lugar</h2>
                <p className="text-gray-600 text-lg leading-relaxed font-medium">
                    {gym.description || "Sin descripción disponible."}
                </p>
            </div>

            {/* Galería Extra (Si hay) */}
            {gym.extraImagesUrls && gym.extraImagesUrls.length > 0 && (
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Galería</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {gym.extraImagesUrls.map((url: string, idx: number) => (
                            <div key={idx} className="relative h-40 rounded-xl overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform">
                                <Image src={url} alt={`Foto ${idx}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Amenities */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Comodidades</h2>
                <div className="flex flex-wrap gap-3">
                    {gym.amenities && gym.amenities.map((item: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg font-bold uppercase text-sm text-gray-700">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* --- MAPA REAL --- */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                    📍 Ubicación <span className="text-red-600">Real</span>
                </h2>
                <div className="border-2 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-gray-100">
                    <iframe
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapUrl}
                    ></iframe>
                    
                    <div className="p-4 bg-white border-t-2 border-black flex justify-between items-center">
                        <p className="text-xs font-bold uppercase text-gray-500 max-w-[60%] truncate">
                            {gym.location}
                        </p>
                        <a 
                            href={gpsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-black uppercase text-xs tracking-wider hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            🗺️ Abrir GPS
                        </a>
                    </div>
                </div>
            </div>

        </div>

        {/* --- COLUMNA DERECHA: RESERVA FLOTANTE --- */}
        <div className="relative">
            <div className="sticky top-24 bg-white border-2 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_#dc2626]">
                <div className="flex justify-between items-end mb-6 border-b-2 border-gray-100 pb-4">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Precio por día</p>
                        <p className="text-4xl font-black text-black">
                            ${Number(gym.pricePerDay || gym.price_per_day).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-bold text-gray-400 uppercase">Dueño</p>
                         <p className="font-bold uppercase text-sm truncate max-w-[100px]">{gym.ownerProfile?.razon_social || "SpaceGym"}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase ml-1 mb-1 block">Fecha</label>
                        <input 
                            type="date" 
                            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:border-black outline-none transition-colors"
                            min={new Date().toISOString().split('T')[0]}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-black uppercase ml-1 mb-1 block">Hora Inicio</label>
                            <input 
                                type="time" 
                                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:border-black outline-none transition-colors"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-black uppercase ml-1 mb-1 block">Horas</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="12"
                                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:border-black outline-none transition-colors text-center"
                                value={hours}
                                onChange={(e) => setHours(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    
                    {/* RESUMEN PRECIO */}
                    <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-gray-500">Total estimado</span>
                        <span className="font-black text-xl">
                            ${((Number(gym.pricePerDay || gym.price_per_day) * 1)).toLocaleString()}
                        </span>
                    </div>

                    <button 
                        onClick={handleReserve}
                        disabled={checking}
                        className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {checking ? 'Verificando...' : 'Reservar Ahora'}
                    </button>

                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase mt-2">
                        No se cobrará nada hasta el siguiente paso
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}