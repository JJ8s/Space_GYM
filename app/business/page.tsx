"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { gymsService } from '@/lib/supabase/gyms-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SettingsFab from '@/components/ui/SettingsFab';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import Image from 'next/image';

export default function BusinessPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Estados de Datos
  const [myGyms, setMyGyms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados QR
  const [qrInput, setQrInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Estados de Edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<any>(null);
  
  // Formulario de Edición
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    pricePerDay: 0,
    amenitiesString: '',
    imageUrl: '',          
    extraImagesUrls: [] as string[] 
  });
  
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  // 1. Protección de Ruta
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'deportista') {
        toast.error("Acceso denegado");
        router.push('/dashboard');
      }
    };
    if (!authLoading && user) checkRole();
  }, [user, authLoading, router]);

  // 2. Cargar Datos
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      const { data: gyms } = await supabase.from('sport_spaces').select('*').eq('owner_id', user.id);
      setMyGyms(gyms || []);

      if (gyms && gyms.length > 0) {
        const gymIds = gyms.map(g => g.id);
        const { data: books } = await supabase.from('bookings')
          .select(`*, profiles:user_id(full_name), sport_spaces(name)`)
          .in('gym_id', gymIds).order('fecha', { ascending: false });
        setBookings(books || []);
      }
      setLoadingData(false);
    };
    if (user) loadData();
  }, [user]);

  // --- NUEVA FUNCIÓN: CANCELAR RESERVA ---
  const handleCancelBooking = async (bookingId: string) => {
    // 1. Confirmación de seguridad
    const confirm = window.confirm("⚠️ ¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.");
    if (!confirm) return;

    const toastId = toast.loading("Cancelando reserva...");

    try {
        // 2. Actualizar en Supabase
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) throw error;

        // 3. Actualizar estado local (para que se refleje sin recargar)
        setBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));

        toast.success("Reserva cancelada exitosamente", { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error("Error al cancelar la reserva", { id: toastId });
    }
  };

  // --- CRUD GIMNASIOS ---
  const handleOpenEdit = (gym: any) => {
    setEditingGym(gym);
    setEditForm({
      name: gym.name,
      description: gym.description || '',
      location: gym.location,
      pricePerDay: gym.price_per_day,
      amenitiesString: (gym.amenities || []).join(', '),
      imageUrl: gym.image_url || '',
      extraImagesUrls: gym.extra_images_urls || []
    });
    setEditModalOpen(true);
  };

  const handleRemoveExtraPhoto = (indexToRemove: number) => {
    const updatedExtras = editForm.extraImagesUrls.filter((_, i) => i !== indexToRemove);
    setEditForm(prev => ({ ...prev, extraImagesUrls: updatedExtras }));
  };

  const handleUploadNewExtra = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingExtra(true);
    const toastId = toast.loading("Subiendo foto...");

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('gym-images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('gym-images').getPublicUrl(filePath);
        setEditForm(prev => ({ ...prev, extraImagesUrls: [...prev.extraImagesUrls, data.publicUrl] }));
        toast.success("Foto agregada", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Error al subir imagen", { id: toastId });
    } finally {
        setUploadingExtra(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym) return;
    setSavingEdit(true);

    try {
      const amenities = editForm.amenitiesString.split(',').map(i => i.trim()).filter(i => i);
      await gymsService.updateGym(editingGym.id, {
        name: editForm.name,
        description: editForm.description,
        location: editForm.location,
        pricePerDay: Number(editForm.pricePerDay),
        amenities,
        imageUrl: editForm.imageUrl,
        extraImagesUrls: editForm.extraImagesUrls
      });

      toast.success("✅ Actualizado correctamente");
      setEditModalOpen(false);
      
      setMyGyms(prev => prev.map(g => g.id === editingGym.id ? { 
        ...g, 
        name: editForm.name,
        description: editForm.description,
        location: editForm.location,
        price_per_day: Number(editForm.pricePerDay),
        amenities,
        image_url: editForm.imageUrl,
        extra_images_urls: editForm.extraImagesUrls
      } : g));

    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("⚠️ ¿Eliminar gimnasio? No se puede deshacer.");
    if (!confirm) return;
    try {
      await gymsService.deleteGym(id);
      toast.success("🗑️ Gimnasio eliminado");
      setMyGyms(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      toast.error("No se pudo eliminar.");
    }
  };

  // --- CÁLCULO DE INGRESOS ---
  const totalEarnings = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => {
        const amount = Number(b.total_price) || Number(b.total) || 0;
        return sum + amount;
    }, 0);

  // --- LÓGICA DE VALIDACIÓN ROBUSTA ---
  const handleCheckIn = async (bookingId: string) => {
    if (!bookingId) return;
    
    // Limpiamos el ID
    const cleanId = bookingId.trim(); 
    
    setShowScanner(false);
    const loadingToast = toast.loading("Verificando en base de datos...");

    try {
        // 1. CONSULTA DIRECTA A SUPABASE
        const { data: bookingRemote, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                *, 
                sport_spaces (
                    name,
                    owner_id
                ),
                profiles (
                    full_name
                )
            `)
            .eq('id', cleanId)
            .single();

        // 2. VALIDACIONES
        if (fetchError || !bookingRemote) {
            toast.error("❌ La reserva no existe en el sistema.", { id: loadingToast });
            return;
        }

        // ¿Es mi gimnasio?
        if (bookingRemote.sport_spaces?.owner_id !== user?.id) {
            toast.error(`⚠️ Esta reserva es para otro gimnasio: ${bookingRemote.sport_spaces?.name}`, { id: loadingToast });
            return;
        }

        // ¿Ya se usó?
        if (bookingRemote.status === 'completed') {
            toast("✋ Este ticket ya fue usado anteriormente.", { icon: '⚠️', id: loadingToast });
            return;
        }

        if (bookingRemote.status === 'cancelled') {
            toast.error("❌ Ticket cancelado previamente.", { id: loadingToast });
            return;
        }

        // 3. ACTUALIZAR A 'COMPLETED'
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', cleanId);

        if (updateError) throw updateError;

        // 4. ÉXITO
        const amount = Number(bookingRemote.total_price) || Number(bookingRemote.total) || 0;
        
        toast.success(
            <div>
                <span className="font-bold block">✅ ¡ACCESO CONCEDIDO!</span>
                <span className="text-sm">Cliente: {bookingRemote.profiles?.full_name}</span>
                <br/>
                <span className="text-sm text-gray-300">Gym: {bookingRemote.sport_spaces?.name}</span>
                <br/>
                {amount > 0 && <span className="text-green-400 font-black">+ ${amount.toLocaleString()} agregados</span>}
            </div>, 
            { 
                id: loadingToast,
                duration: 5000, 
                style: { background: '#111', color: '#fff', border: '2px solid #22c55e' } 
            }
        );

        // Actualizar lista local
        setBookings(prev => {
            const exists = prev.find(b => b.id === cleanId);
            if (exists) {
                return prev.map(b => b.id === cleanId ? { ...b, status: 'completed' } : b);
            } else {
                return [bookingRemote, ...prev]; 
            }
        });
        
        setQrInput("");

    } catch (err) {
        console.error(err);
        toast.error("Error de conexión al validar.", { id: loadingToast });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || loadingData) return <div className="min-h-screen flex items-center justify-center font-bold text-xl italic">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b-4 border-black px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 transform -skew-x-12"></div>
            <span className="text-xl font-black tracking-tighter italic">
                SPACE<span className="text-red-600">GYM</span> <span className="text-xs bg-black text-white px-2 py-1 ml-2 not-italic font-bold -skew-x-12 inline-block">BUSINESS</span>
            </span>
        </div>
        <button onClick={logout} className="text-sm font-bold uppercase tracking-wider hover:text-red-600 transition-colors">
            Cerrar Sesión
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-10">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-gray-200 pb-8">
            <div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Panel de Control</h1>
                <p className="text-gray-500 font-medium">Gestiona tus espacios y ganancias.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <Link href="/dashboard/publish" className="flex-1 md:flex-none group relative px-6 py-3 bg-red-600 text-white font-black uppercase tracking-wider text-sm text-center transform -skew-x-12 hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                    <div className="skew-x-12 flex items-center justify-center gap-2"><span>+ PUBLICAR GYM</span></div>
                </Link>
                <Link href="/business/profile" className="flex-1 md:flex-none group relative px-6 py-3 bg-black text-white font-black uppercase tracking-wider text-sm text-center transform -skew-x-12 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_#dc2626] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                    <div className="skew-x-12 flex items-center justify-center gap-2"><span>🏢 DATOS EMPRESA</span></div>
                </Link>
            </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">INGRESOS TOTALES</p>
            <p className="text-4xl font-black mt-2 text-gray-900 transition-all duration-500">
                ${totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">RESERVAS CONFIRMADAS</p>
            <p className="text-4xl font-black mt-2 text-red-600">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ZONA DE VALIDACIÓN */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-black p-6 border-2 border-black shadow-[8px_8px_0px_0px_#dc2626]">
              <div className="font-black italic text-xl mb-6 uppercase flex items-center gap-3" style={{ color: '#ffffff' }}>
                 <span className="text-2xl">📸</span>
                 <span>VALIDAR ENTRADA</span>
              </div>
              
              {!showScanner ? (
                <div className="mb-4">
                    <button onClick={() => setShowScanner(true)} className="w-full py-10 border-2 border-dashed border-gray-600 hover:border-red-600 hover:bg-gray-900 transition-all group rounded-lg">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-4xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">📷</span>
                            <span className="font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors text-sm">Toca para Escanear QR</span>
                        </div>
                    </button>
                </div>
              ) : (
                <div className="mb-4 relative border-2 border-red-600 rounded-lg overflow-hidden bg-black h-80">
                    <Scanner onScan={(result) => { if (result && result.length > 0) handleCheckIn(result[0].rawValue); }} />
                    <button onClick={() => setShowScanner(false)} className="absolute top-3 right-3 bg-red-600 text-white px-4 py-1 text-xs font-bold rounded shadow-lg z-10 hover:bg-red-700">CERRAR</button>
                </div>
              )}

              <div className="flex gap-0 pt-6 border-t border-gray-800">
                <input value={qrInput} onChange={e => setQrInput(e.target.value)} placeholder="O escribe el ID manual..." className="grow p-3 bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none font-mono" />
                <button onClick={() => handleCheckIn(qrInput)} className="bg-white text-black px-6 font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors border-2 border-white hover:border-red-600">MANUAL</button>
              </div>
            </div>
            
            {/* Lista Reservas (CON BOTÓN DE CANCELAR NUEVO) */}
            <div className="border-2 border-gray-200 bg-white">
              <div className="p-4 border-b-2 border-gray-100 bg-gray-50 font-black text-xs text-gray-400 uppercase tracking-widest">Últimas Reservas</div>
              {bookings.length === 0 && <div className="p-8 text-center text-gray-400 italic">No hay movimientos recientes.</div>}
              {bookings.map(b => (
                <div key={b.id} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="font-bold text-lg">{b.profiles?.full_name || 'Cliente'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-medium mt-1">
                        <span className="text-red-600 font-bold">{b.sport_spaces?.name}</span>
                        <span>•</span>
                        <span>{b.fecha}</span>
                        <span>•</span>
                        <span className="text-gray-800 font-bold">
                            ${(Number(b.total_price) || Number(b.total) || 0).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-300 mt-1 group-hover:text-gray-500">ID: {b.id}</p>
                  </div>
                  
                  {/* AQUÍ ESTÁ EL CAMBIO: Botón Cancelar junto al Badge */}
                  <div className="flex items-center gap-3">
                      {/* Solo mostramos botón si NO está cancelada ni completada */}
                      {(b.status !== 'cancelled' && b.status !== 'completed') && (
                          <button 
                            onClick={() => handleCancelBooking(b.id)}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-600 border-b border-transparent hover:border-red-600 transition-all uppercase"
                          >
                            Cancelar
                          </button>
                      )}

                      <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 ${
                        b.status === 'completed' ? 'bg-black text-white border-black' : 
                        b.status === 'cancelled' ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' :
                        'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        {b.status === 'completed' ? 'VALIDADO' : 
                         b.status === 'cancelled' ? 'CANCELADO' : 'PENDIENTE'}
                      </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MIS ESPACIOS */}
          <div className="space-y-6">
            <h2 className="font-black text-2xl italic tracking-tighter uppercase border-b-4 border-red-600 inline-block pb-1">Mis Espacios</h2>
            {myGyms.map(gym => (
              <div key={gym.id} className="bg-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-lg uppercase leading-tight">{gym.name}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">{gym.location}</p>
                  </div>
                  <p className="text-red-600 font-black text-xl">${Number(gym.price_per_day).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t-2 border-gray-100">
                  <button onClick={() => handleOpenEdit(gym)} className="flex-1 text-xs bg-gray-100 hover:bg-black hover:text-white text-black py-2 font-bold uppercase tracking-wider transition-colors">Editar</button>
                  <button onClick={() => handleDelete(gym.id)} className="flex-1 text-xs bg-red-50 hover:bg-red-600 hover:text-white text-red-600 py-2 font-bold uppercase tracking-wider transition-colors">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <SettingsFab />
      
      {/* MODAL DE EDICIÓN */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Espacio">
        <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div className="border-b border-gray-200 pb-4 mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Gestionar Fotos</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <div className="relative w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-black cursor-pointer flex-shrink-0">
                        <span className="text-xl">{uploadingExtra ? '⏳' : '+'}</span>
                        <input type="file" accept="image/*" onChange={handleUploadNewExtra} disabled={uploadingExtra} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                    {editForm.imageUrl && (
                         <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500 flex-shrink-0" title="Foto Principal">
                            <Image src={editForm.imageUrl} alt="Principal" fill className="object-cover" />
                        </div>
                    )}
                    {editForm.extraImagesUrls.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                            <Image src={url} alt={`Extra ${idx}`} fill className="object-cover" />
                            <button type="button" onClick={() => handleRemoveExtraPhoto(idx)} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    ))}
                </div>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium" required /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción</label><textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium" required rows={2}/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Precio</label><input type="number" value={editForm.pricePerDay} onChange={e => setEditForm({...editForm, pricePerDay: Number(e.target.value)})} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label><input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium" required /></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Comodidades</label><input value={editForm.amenitiesString} onChange={e => setEditForm({...editForm, amenitiesString: e.target.value})} className="w-full p-3 border-2 border-gray-200 focus:border-black outline-none font-medium" /></div>
            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold uppercase text-xs">Cancelar</button><button type="submit" disabled={savingEdit} className="flex-1 py-3 bg-black text-white font-bold uppercase text-xs shadow-md">Guardar</button></div>
        </form>
      </Modal>
    </div>
  );
}