"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gymsService } from '@/lib/supabase/gyms-service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GymDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [gym, setGym] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]); // Bloques reales de BD
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [date, setDate] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (params.id) {
      const loadData = async () => {
        try {
            // 1. Cargar Gym
            const gymData = await gymsService.getGymById(params.id as string);
            setGym(gymData);

            // 2. Cargar Bloques
            const { data: blocksData } = await supabase
                .from('gym_blocks')
                .select('*')
                .eq('gym_id', params.id)
                .order('start_time', { ascending: true });
            
            setBlocks(blocksData || []);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
      };
      loadData();
    }
  }, [params.id]);

  const handleReserve = async () => {
    if (!user) { toast.error("Inicia sesión primero"); router.push('/auth'); return; }
    if (!date || !selectedBlock) { toast.error("Faltan datos"); return; }

    setChecking(true);
    try {
        await gymsService.checkAvailability(gym.id, date, selectedBlock.start_time, 1);
        
        const query = new URLSearchParams({
            gymId: gym.id,
            fecha: date,
            hora: selectedBlock.start_time,
            horas: "1",
            dias: "1" 
        }).toString();
        
        router.push(`/dashboard/checkout?${query}`);
    } catch (error: any) {
        toast.error(error.message || "No disponible");
    } finally {
        setChecking(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic">CARGANDO...</div>;
  if (!gym) return <div>No encontrado</div>;

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(gym.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const imageSrc = gym.imageUrl || gym.image_url;
  const rating = Number(gym.rating) || 0;
  const isNew = rating === 0;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans text-gray-900">
      
      {/* HERO IMAGE */}
      <div className="relative h-[50vh] w-full bg-gray-900">
        {imageSrc ? (
            <Image src={imageSrc} alt={gym.name} fill className="object-cover opacity-60"/>
        ) : (
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl grayscale opacity-20">🏋️</span></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
            <div className="max-w-7xl mx-auto">
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 inline-block shadow-sm ${isNew ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {isNew ? '🌱 Espacio Nuevo' : `★ ${rating} • Verificado`}
                </span>
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-black leading-none mb-2 drop-shadow-sm">{gym.name}</h1>
                <p className="text-xl font-bold text-gray-600 uppercase flex items-center gap-2">📍 {gym.location}</p>
            </div>
        </div>
        <Link href="/dashboard" className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full font-bold uppercase text-xs hover:bg-white hover:text-black transition-all">← Volver</Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
        
        {/* IZQUIERDA */}
        <div className="lg:col-span-2 space-y-12">
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter border-b-4 border-black inline-block mb-6">Sobre el Lugar</h2>
                <p className="text-gray-600 text-lg leading-relaxed font-medium">{gym.description || "Sin descripción."}</p>
            </div>

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

            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Comodidades</h2>
                <div className="flex flex-wrap gap-3">
                    {gym.amenities && gym.amenities.map((item: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg font-bold uppercase text-sm text-gray-700">{item}</span>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">📍 Ubicación</h2>
                <div className="border-2 border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-gray-100">
                    <iframe width="100%" height="350" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={mapUrl}></iframe>
                </div>
            </div>
        </div>

        {/* DERECHA (RESERVA) */}
        <div className="relative">
            <div className="sticky top-24 bg-white border-2 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_#dc2626]">
                <div className="flex justify-between items-end mb-6 border-b-2 border-gray-100 pb-4">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Precio por día</p>
                        <p className="text-4xl font-black text-black">${Number(gym.pricePerDay || gym.price_per_day).toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase ml-1 mb-1 block">1. Fecha</label>
                        <input 
                            type="date" 
                            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:border-black outline-none"
                            min={new Date().toISOString().split('T')[0]}
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setSelectedBlock(null); }}
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-black uppercase ml-1 mb-1 block">2. Horario</label>
                        {blocks.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                {blocks.map((block) => {
                                    const isSelected = selectedBlock?.id === block.id;
                                    const label = `${block.start_time.slice(0,5)} - ${block.end_time.slice(0,5)}`;
                                    return (
                                        <button
                                            key={block.id}
                                            onClick={() => setSelectedBlock(block)}
                                            className={`py-3 px-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${isSelected ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-600 hover:text-red-600'}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Sin horarios</p></div>
                        )}
                        {selectedBlock && <p className="text-xs text-center mt-3 font-bold text-red-600 uppercase animate-pulse">Seleccionado: {selectedBlock.start_time.slice(0,5)}</p>}
                    </div>

                    <button 
                        onClick={handleReserve}
                        disabled={checking || !date || !selectedBlock}
                        className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {checking ? 'Verificando...' : 'Reservar Ahora'}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}