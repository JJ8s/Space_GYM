"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { gymsService } from '@/lib/supabase/gyms-service';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GymCard from '@/components/dashboard/GymCard';
import Link from 'next/link';
import Image from 'next/image'; // <--- IMPORTANTE: Necesario para la foto
import { Search, LogOut, Ticket, ChevronDown, ChevronUp, Filter, User } from 'lucide-react'; 

const COMMON_AMENITIES = ["Estacionamiento", "Duchas", "Wifi", "Aire Acondicionado", "Camarines", "Cafetería", "Seguridad", "Acceso Controlado"];
const ZONES = ["Santiago", "Centro", "Providencia", "Las Condes", "Maipú", "La Florida"];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [gyms, setGyms] = useState<any[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NUEVO: Estado para guardar la info del perfil (foto y nombre)
  const [profile, setProfile] = useState<any>(null);

  const [searchText, setSearchText] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState({ search: true, zones: true, amenities: true });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    
    const fetchData = async () => {
      try {
        // 1. Cargar Gimnasios
        const data = await gymsService.getAllGyms();
        setGyms(data || []);
        setFilteredGyms(data || []);

        // 2. Cargar Perfil (PARA OBTENER NOMBRE Y FOTO)
        if (user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);
        }

      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };

    if (user) fetchData();
  }, [user, authLoading, router]);

  useEffect(() => {
    const results = gyms.filter(gym => {
        const term = searchText.toLowerCase();
        const matchesText = gym.name.toLowerCase().includes(term) || gym.location.toLowerCase().includes(term);
        const gymAmenities = (gym.amenities || []).map((a: string) => a.toLowerCase());
        const matchesAmenities = selectedAmenities.every(sel => gymAmenities.some((gArg: string) => gArg.includes(sel.toLowerCase())));
        const gymLocation = gym.location.toLowerCase();
        const matchesZones = selectedZones.length === 0 || selectedZones.some(zone => gymLocation.includes(zone.toLowerCase()));
        return matchesText && matchesAmenities && matchesZones;
    });
    setFilteredGyms(results);
  }, [searchText, selectedAmenities, selectedZones, gyms]);

  const toggleAmenity = (amenity: string) => setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  const toggleZone = (zone: string) => setSelectedZones(prev => prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]);
  const toggleSection = (section: 'search' | 'zones' | 'amenities') => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const clearFilters = () => { setSearchText(""); setSelectedAmenities([]); setSelectedZones([]); };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando catálogo...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-800">
      
      {/* NAVBAR */}
      <nav className="bg-black text-white px-4 py-3 sticky top-0 z-50 shadow-md w-full">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black italic tracking-tighter">SPACE<span className="text-red-600">GYM</span></span>
            </div>
            
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                <input className="w-full py-2 pl-4 pr-10 rounded text-black text-sm focus:outline-none" placeholder="Buscar gimnasio..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                <Search className="absolute right-2 top-2 text-gray-400" size={18} />
            </div>

            <div className="flex items-center gap-4 text-xs font-bold uppercase">
                <Link href="/dashboard/reservations" className="hover:text-red-500 transition-colors flex items-center gap-1"><Ticket size={16} /> Mis Tickets</Link>
                <button onClick={handleLogout} className="hover:text-red-500 transition-colors flex items-center gap-1">Salir <LogOut size={16} /></button>
            </div>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="max-w-[1400px] mx-auto p-6">
        
        {/* TÍTULO */}
        <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo</h1>
                <p className="text-sm text-gray-500 mt-1">{filteredGyms.length} resultados</p>
            </div>
            {(selectedAmenities.length > 0 || selectedZones.length > 0 || searchText) && (
                <button onClick={clearFilters} className="text-sm text-red-600 hover:underline font-medium">Borrar filtros</button>
            )}
        </div>

        {/* --- LAYOUT --- */}
        <div className="flex gap-8 items-start">
            
            {/* === SIDEBAR (IZQUIERDA) === */}
            <aside className="w-64 shrink-0 space-y-4 hidden md:block sticky top-20">
                
                {/* --- NUEVO: TARJETA DE PERFIL (Aquí está lo que pediste) --- */}
                <div className="bg-white border border-gray-200 rounded p-4 shadow-sm flex items-center gap-3">
                    {/* Contenedor de la foto (Círculo) */}
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 overflow-hidden relative shrink-0">
                        {profile?.avatar_url ? (
                            <Image 
                                src={profile.avatar_url} 
                                alt="Perfil" 
                                fill 
                                className="object-cover" 
                            />
                        ) : (
                            <User className="text-gray-400" size={20} />
                        )}
                    </div>
                    {/* Info Nombre */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Hola,</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {profile?.full_name || user?.email?.split('@')[0]}
                        </p>
                    </div>
                    <Link href="/dashboard/profile" className="text-xs font-bold text-red-600 hover:underline">
                        VER
                    </Link>
                </div>
                {/* ------------------------------------------------------------- */}

                {/* Filtro: Nombre */}
                <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                    <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => toggleSection('search')}>
                        <h3 className="font-bold text-sm text-gray-700">Nombre</h3>
                        {openSections.search ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>
                    {openSections.search && (
                        <div className="relative">
                            <input type="text" placeholder="Ej: Smart Fit..." className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black focus:outline-none" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                            <Search size={14} className="absolute right-3 top-3 text-gray-400"/>
                        </div>
                    )}
                </div>

                {/* Filtro: Ubicación */}
                <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                    <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => toggleSection('zones')}>
                        <h3 className="font-bold text-sm text-gray-700">Ubicación</h3>
                        {openSections.zones ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>
                    {openSections.zones && (
                        <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {ZONES.map(zone => (
                                <label key={zone} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-50 rounded px-1">
                                    <input type="checkbox" className="accent-black w-4 h-4" checked={selectedZones.includes(zone)} onChange={() => toggleZone(zone)} />
                                    <span className="text-sm text-gray-600">{zone}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filtro: Amenities */}
                <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                    <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => toggleSection('amenities')}>
                        <h3 className="font-bold text-sm text-gray-700">Características</h3>
                        {openSections.amenities ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>
                    {openSections.amenities && (
                        <div className="space-y-1">
                            {COMMON_AMENITIES.map(amenity => (
                                <label key={amenity} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-50 rounded px-1">
                                    <input type="checkbox" className="accent-black w-4 h-4" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
                                    <span className="text-sm text-gray-600">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* === RESULTADOS (DERECHA) === */}
            <main className="flex-1 w-full min-w-0">
                {filteredGyms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGyms.map((gym) => (
                            <GymCard key={gym.id} gym={gym} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded p-12 text-center">
                        <div className="text-5xl mb-4">😕</div>
                        <h3 className="font-bold text-gray-900">No hay resultados</h3>
                        <button onClick={clearFilters} className="mt-4 text-red-600 font-bold hover:underline text-sm">Limpiar filtros</button>
                    </div>
                )}
            </main>

        </div>
      </div>
    </div>
  );
}