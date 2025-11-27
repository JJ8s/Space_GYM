"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { gymsService } from '@/lib/supabase/gyms-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SettingsFab from '@/components/ui/SettingsFab';
import Modal from '@/components/ui/Modal'; // Asegúrate de tener este componente

export default function BusinessPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Estados de Datos
  const [myGyms, setMyGyms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [qrInput, setQrInput] = useState("");

  // --- ESTADOS PARA EDICIÓN ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<any>(null);
  // Estado local del formulario de edición
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    pricePerDay: 0,
    amenitiesString: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  // ----------------------------

  // 1. Protección de Ruta
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'deportista') router.push('/dashboard');
    };
    if (!authLoading && user) checkRole();
  }, [user, authLoading, router]);

  // 2. Cargar Datos Iniciales
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Cargar Mis Gimnasios
      const { data: gyms } = await supabase.from('sport_spaces').select('*').eq('owner_id', user.id);
      setMyGyms(gyms || []);

      // Cargar Reservas
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

  // --- LÓGICA DE GESTIÓN (CRUD) ---

  // A) Abrir Modal y Cargar Datos
  const handleOpenEdit = (gym: any) => {
    setEditingGym(gym);
    setEditForm({
      name: gym.name,
      description: gym.description || '',
      location: gym.location,
      pricePerDay: gym.price_per_day, // Ojo con snake_case de la BD
      amenitiesString: (gym.amenities || []).join(', ')
    });
    setEditModalOpen(true);
  };

  // B) Guardar Cambios (Update)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym) return;
    setSavingEdit(true);

    try {
      // Convertir string de amenities a array
      const amenities = editForm.amenitiesString.split(',').map(i => i.trim()).filter(i => i);
      
      // Llamar al servicio actualizado
      await gymsService.updateGym(editingGym.id, {
        name: editForm.name,
        description: editForm.description,
        location: editForm.location,
        pricePerDay: Number(editForm.pricePerDay),
        amenities
      });

      alert("✅ Gimnasio actualizado correctamente");
      setEditModalOpen(false);
      
      // Actualizar la lista visualmente (Optimistic UI)
      setMyGyms(prev => prev.map(g => g.id === editingGym.id ? { 
        ...g, 
        ...editForm, 
        price_per_day: Number(editForm.pricePerDay), 
        amenities 
      } : g));

    } catch (error) {
      console.error(error);
      alert("Error al actualizar el gimnasio");
    } finally {
      setSavingEdit(false);
    }
  };

  // C) Eliminar Gimnasio (Delete)
  const handleDelete = async (id: string) => {
    const confirm = window.confirm("⚠️ ¿Estás seguro de eliminar este gimnasio?\n\nEsta acción no se puede deshacer y borrará el espacio de la plataforma.");
    if (!confirm) return;

    try {
      await gymsService.deleteGym(id);
      alert("🗑️ Gimnasio eliminado");
      
      // Quitar de la lista visualmente
      setMyGyms(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error al eliminar. Es posible que tenga reservas activas asociadas.");
    }
  };
  // --------------------------------

  // Reportes y QR (SCRUM-9)
  const totalEarnings = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  const handleCheckIn = async (bookingId: string) => {
    if (!bookingId) return;
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
    if (!error) {
      alert("✅ Asistencia Validada");
      setBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: 'completed'} : b));
      setQrInput("");
    } else alert("❌ ID no encontrado");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || loadingData) return <div className="p-10 text-center">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-gray-900 text-white px-6 py-4 shadow-md flex justify-between">
        <span className="font-bold">SpaceGym Business</span>
        <button onClick={logout}>Cerrar Sesión</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <Link href="/dashboard/publish" className="bg-[#78BE20] text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition-all">+ Publicar</Link>
        </div>

        {/* Dashboard de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <p className="text-xs font-bold text-gray-500">INGRESOS TOTALES</p>
            <p className="text-3xl font-bold mt-2">${totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <p className="text-xs font-bold text-gray-500">RESERVAS ACTIVAS</p>
            <p className="text-3xl font-bold mt-2">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Reservas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h2 className="font-bold mb-4">📸 Validar QR</h2>
              <div className="flex gap-2">
                <input value={qrInput} onChange={e => setQrInput(e.target.value)} placeholder="ID Reserva..." className="flex-grow p-2 border rounded-lg" />
                <button onClick={() => handleCheckIn(qrInput)} className="bg-black text-white px-4 rounded-lg">Validar</button>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-500">Últimas Reservas</div>
              {bookings.length === 0 && <div className="p-6 text-center text-gray-400">Sin movimientos recientes.</div>}
              {bookings.map(b => (
                <div key={b.id} className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-bold">{b.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">{b.sport_spaces?.name} • {b.fecha}</p>
                    <p className="text-xs font-mono text-gray-400">ID: {b.id}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Mis Espacios (Con Botones) */}
          <div className="space-y-4">
            <h2 className="font-bold text-xl">Mis Espacios</h2>
            {myGyms.map(gym => (
              <div key={gym.id} className="bg-white p-4 rounded-xl shadow-sm border group hover:border-green-400 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{gym.name}</h3>
                    <p className="text-xs text-gray-500">{gym.location}</p>
                  </div>
                  <p className="text-green-600 font-bold">${Number(gym.price_per_day).toLocaleString()}</p>
                </div>
                
                {/* BOTONES DE ACCIÓN */}
                <div className="mt-4 pt-3 border-t flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(gym)}
                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-bold transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(gym.id)}
                    className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-bold transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <SettingsFab />

      {/* --- MODAL DE EDICIÓN --- */}
      <Modal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        title="Editar Espacio"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
            <input 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black/20 outline-none" 
              required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <textarea 
              value={editForm.description} 
              onChange={e => setEditForm({...editForm, description: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black/20 outline-none" 
              required rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Precio (CLP)</label>
              <input 
                type="number"
                value={editForm.pricePerDay} 
                onChange={e => setEditForm({...editForm, pricePerDay: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black/20 outline-none" 
                required 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label>
              <input 
                value={editForm.location} 
                onChange={e => setEditForm({...editForm, location: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black/20 outline-none" 
                required 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Comodidades</label>
            <input 
              value={editForm.amenitiesString} 
              onChange={e => setEditForm({...editForm, amenitiesString: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black/20 outline-none" 
              placeholder="Wifi, Duchas..."
            />
            <p className="text-[10px] text-gray-400 mt-1">Separar con comas</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setEditModalOpen(false)}
              className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={savingEdit}
              className="flex-1 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold"
            >
              {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}