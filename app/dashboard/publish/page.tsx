"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { gymsService } from '@/lib/supabase/gyms-service'; // Mantenemos importación aunque usaremos supabase directo para asegurar IDs
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';

const DEFAULT_AMENITIES = [
  "🚿 Duchas", "🅿️ Estacionamiento", "📶 Wifi", "❄️ Aire Acondicionado", 
  "🔒 Lockers", "🥤 Bebidas", "🧘 Zona Yoga", "🏋️ Pesas Libres"
];

interface ScheduleBlock { open: string; close: string; }

export default function PublishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const [amenitiesList, setAmenitiesList] = useState(DEFAULT_AMENITIES);
  const extraFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: 0,
    location: '',
    amenities: [] as string[],
    imageFile: null as File | null,
    imagePreview: '',
    extraImageFiles: [] as File[],
    extraImagePreviews: [] as string[],
    schedule: [{ open: '09:00', close: '18:00' }] as ScheduleBlock[]
  });

  useEffect(() => {
    const checkRequirements = async () => {
      if (authLoading) return;
      if (!user) { router.push('/auth'); return; }
      const { data } = await supabase.from('profiles').select('role, is_verified, rut_empresa').eq('id', user.id).single();
      if (data?.role === 'deportista') {
        toast.error("Acceso denegado");
        router.push('/dashboard');
        return;
      }
      if (!data?.is_verified || !data?.rut_empresa) {
        toast.error("Completa tu perfil primero");
        router.push('/business/profile');
      }
    };
    checkRequirements();
  }, [user, authLoading, router]);

  const processMainFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return toast.error("Solo imágenes válidas");
    const objectUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, imageFile: file, imagePreview: objectUrl }));
  };
  const handleMainImageChange = (e: any) => { const file = e.target.files[0]; if (file) processMainFile(file); };
  const handleExtraImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setFormData(prev => {
            const newFiles = [...prev.extraImageFiles];
            const newPreviews = [...prev.extraImagePreviews];
            newFiles[index] = file;
            newPreviews[index] = objectUrl;
            return { ...prev, extraImageFiles: newFiles, extraImagePreviews: newPreviews };
        });
    }
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) processMainFile(e.dataTransfer.files[0]); };

  const uploadImageToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;
      const { error } = await supabase.storage.from('gym-images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('gym-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) { console.error(error); return null; }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return { ...prev, amenities: exists ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity] };
    });
  };
  const handleAddCustomAmenity = () => {
    if (newAmenity.trim()) {
        const val = `✨ ${newAmenity}`;
        setAmenitiesList([...amenitiesList, val]);
        toggleAmenity(val);
        setNewAmenity("");
    }
  };

  const addScheduleBlock = () => {
    setFormData(prev => ({
        ...prev,
        schedule: [...prev.schedule, { open: '09:00', close: '18:00' }]
    }));
  };

  const removeScheduleBlock = (index: number) => {
    if (formData.schedule.length === 1) {
        toast.error("Debes tener al menos un horario");
        return; 
    }
    setFormData(prev => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const updateScheduleBlock = (index: number, field: 'open' | 'close', value: string) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  // --- ENVÍO (CORREGIDO: Insertamos los bloques manualmente) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.pricePerDay || !formData.location) {
        toast.error("Faltan datos obligatorios");
        setLoading(false);
        return;
    }

    try {
        let finalImageUrl = null;
        const finalExtraImageUrls: string[] = [];

        setUploading(true);
        const toastId = toast.loading("Publicando...");

        if (formData.imageFile) {
            toast.loading("Subiendo fotos...", { id: toastId });
            finalImageUrl = await uploadImageToSupabase(formData.imageFile);
        }

        if (formData.extraImageFiles.length > 0) {
            for (const file of formData.extraImageFiles) {
                if (file) {
                    const url = await uploadImageToSupabase(file);
                    if (url) finalExtraImageUrls.push(url);
                }
            }
        }
        
        // 1. Crear el GIMNASIO y obtener su ID
        const { data: gymData, error: gymError } = await supabase
            .from('sport_spaces')
            .insert({
                owner_id: user!.id,
                name: formData.name,
                description: formData.description,
                location: formData.location,
                price_per_day: Number(formData.pricePerDay),
                amenities: formData.amenities,
                image_url: finalImageUrl,
                extra_images_urls: finalExtraImageUrls,
                rating: 0 // Inicia como nuevo
            })
            .select()
            .single();

        if (gymError) throw gymError;

        // 2. Crear los BLOQUES DE HORARIO vinculados al gym
        // Transformamos los bloques del UI a formato BD
        const blocksToInsert = formData.schedule.map(block => ({
            gym_id: gymData.id,
            start_time: block.open,
            end_time: block.close,
            price: Number(formData.pricePerDay) // Precio por defecto del bloque
        }));

        const { error: blocksError } = await supabase
            .from('gym_blocks')
            .insert(blocksToInsert);

        if (blocksError) throw blocksError;
        
        toast.success("¡Publicado exitosamente!", { id: toastId });
        setTimeout(() => router.push('/business'), 1500);

    } catch (e: any) { 
        console.error(e);
        toast.error("Error al publicar: " + e.message);
    } finally {
        setLoading(false);
        setUploading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-black italic">Cargando editor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b-4 border-black px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-black italic tracking-tighter uppercase">PUBLICAR <span className="text-red-600">ESPACIO</span></h1>
        <Link href="/business" className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider">✕ Cancelar</Link>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
            {/* FOTOS */}
            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <h2 className="font-black italic text-lg mb-4 uppercase">1. Fotos del Espacio</h2>
                <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`relative border-2 border-dashed rounded-xl aspect-video overflow-hidden transition-all cursor-pointer ${isDragging ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-black'}`}>
                    {formData.imagePreview ? (
                        <>
                            <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><p className="text-white font-bold uppercase">Cambiar Foto</p></div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                            <span className="text-4xl mb-2">📷</span>
                            <p className="font-bold text-xs uppercase">{isDragging ? '¡SUÉLTALA!' : 'ARRASTRA TU FOTO AQUÍ'}</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleMainImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
                {/* Extras */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className={`aspect-square relative rounded-lg overflow-hidden border-2 ${formData.imageFile ? 'cursor-pointer hover:border-black' : 'cursor-not-allowed border-gray-200 bg-gray-100'}`} onClick={() => formData.imageFile && extraFileInputRefs.current[index]?.click()}>
                            {formData.extraImagePreviews[index] ? <Image src={formData.extraImagePreviews[index]} alt="Extra" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase">+ Extra</div>}
                            <input type="file" accept="image/*" ref={(el) => { extraFileInputRefs.current[index] = el }} onChange={(e) => handleExtraImageChange(e, index)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={!formData.imageFile} />
                        </div>
                    ))}
                </div>
            </div>

            {/* DATOS */}
            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-4">
                <h2 className="font-black italic text-lg mb-2 uppercase">2. Detalles</h2>
                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Iron Paradise Gym" className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-bold" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Precio Día</label><input type="number" value={formData.pricePerDay === 0 ? '' : formData.pricePerDay} onChange={(e) => setFormData({...formData, pricePerDay: e.target.value === '' ? 0 : Number(e.target.value)})} placeholder="$" className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-bold" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Ubicación</label><input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Dirección..." className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-bold" /></div>
                </div>
                <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Descripción</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium resize-none" /></div>
            </div>

            {/* SECCIÓN HORARIOS */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-3">Horas Disponibilidad</label>
                
                <div className="space-y-3">
                    {formData.schedule.map((block, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Inicio</label>
                                <input 
                                    type="time" 
                                    value={block.open}
                                    onChange={(e) => updateScheduleBlock(index, 'open', e.target.value)}
                                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-black font-mono text-center" 
                                />
                            </div>
                            <span className="mt-4 text-gray-400 font-bold">-</span>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Término</label>
                                <input 
                                    type="time" 
                                    value={block.close}
                                    onChange={(e) => updateScheduleBlock(index, 'close', e.target.value)}
                                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-black font-mono text-center" 
                                />
                            </div>
                            
                            {formData.schedule.length > 1 && (
                                <button type="button" onClick={() => removeScheduleBlock(index)} className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar bloque">🗑️</button>
                            )}
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addScheduleBlock} className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-xs uppercase rounded-lg hover:border-black hover:text-black hover:bg-white transition-all flex items-center justify-center gap-2">
                    <span className="text-lg leading-none">+</span> Agregar bloque
                </button>
            </div>

            {/* EXTRAS */}
            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <h2 className="font-black italic text-lg mb-4 uppercase">3. Comodidades</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {amenitiesList.map(amenity => (
                        <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`p-3 text-xs font-bold uppercase tracking-wide border-2 transition-all text-left ${formData.amenities.includes(amenity) ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#dc2626] translate-x-[1px] translate-y-[1px]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>{amenity}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Otro..." className="grow p-2 border-2 border-gray-200 text-sm focus:border-black outline-none" />
                    <button type="button" onClick={handleAddCustomAmenity} className="bg-gray-100 px-4 text-xs font-bold uppercase border-2 border-gray-300 hover:bg-black hover:text-white transition-colors">+ Agregar</button>
                </div>
            </div>

            <button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-5 bg-red-600 text-white font-black text-xl uppercase tracking-widest hover:bg-black transition-all shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                {uploading ? 'Subiendo fotos...' : (loading ? 'Publicando...' : 'Lanzar Publicación')}
            </button>
        </div>

        {/* VISTA PREVIA (NO CAMBIA) */}
        <div className="hidden lg:block relative">
            <div className="sticky top-28 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Así lo verán los clientes</h3>
                <div className="bg-white rounded-3xl overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                    <div className="h-64 bg-gray-200 relative">
                        {formData.imagePreview ? <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><span className="text-gray-300 text-6xl">🏋️</span></div>}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-gray-200">⭐ 5.0</div>
                    </div>
                    
                    {formData.extraImagePreviews.filter(Boolean).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-t border-gray-100">
                            {formData.extraImagePreviews.filter(Boolean).map((src, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                    <Image src={src} alt={`Extra ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-black italic uppercase leading-none">{formData.name || 'Tu Gimnasio'}</h2>
                            <div className="text-right">
                                <p className="text-red-600 font-black text-xl">${Number(formData.pricePerDay).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Por día</p>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-1">📍 {formData.location || 'Ubicación...'}</p>
                        
                        <div className="mb-4 flex flex-col gap-1">
                            {formData.schedule.map((block, idx) => (
                                <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 w-fit">
                                    🕒 {block.open} - {block.close}
                                </span>
                            ))}
                        </div>

                        <p className="text-sm text-gray-600 mb-6 line-clamp-3">{formData.description || 'Descripción del espacio...'}</p>
                        <button disabled className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">Reservar Ahora</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}