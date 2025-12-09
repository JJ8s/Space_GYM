"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import QRCode from 'react-qr-code'; 
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import RateModal from '@/components/ui/RateModal'; // <--- IMPORTAMOS EL MODAL

export default function MyReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [bookings, setBookings] = useState<any[]>([]);
  const router = useRouter();

  // Estado para el QR Expandido
  const [expandedQr, setExpandedQr] = useState<string | null>(null);

  // Estados para el Modal de Calificación
  const [ratingModal, setRatingModal] = useState({ open: false, bookingId: '', gymId: '' });

  // Cargar Reservas
  const fetchBookings = async () => {
    if (!user) return;
    try {
      // Pedimos también si ya tiene review
      const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            sport_spaces (
                id,
                name,
                location,
                image_url
            ),
            reviews (id) 
        `)
        .eq('user_id', user.id)
        .order('fecha', { ascending: false }); 

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar tus tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/auth');
    }
    if (user) fetchBookings();
  }, [user, authLoading, router]);

  // --- LÓGICA DE CANCELACIÓN ---
  const handleCancelBooking = async (bookingId: string) => {
    const confirm = window.confirm("⚠️ ¿Estás seguro de cancelar? Se eliminará tu reserva y perderás el cupo.");
    if (!confirm) return;

    const toastId = toast.loading("Eliminando reserva...");

    try {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) throw error;

        setBookings(prev => prev.filter(b => b.id !== bookingId));
        toast.success("Reserva cancelada y eliminada", { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error("No se pudo cancelar la reserva", { id: toastId });
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const historyBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center font-black italic">CARGANDO TICKETS...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20 font-sans text-gray-900">
      
      {/* MODAL DE CALIFICACIÓN */}
      <RateModal 
        isOpen={ratingModal.open}
        bookingId={ratingModal.bookingId}
        gymId={ratingModal.gymId}
        onClose={() => setRatingModal({ open: false, bookingId: '', gymId: '' })}
        onSuccess={() => fetchBookings()} // Recargar para ocultar el botón
      />

      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">Mis <span className="text-red-600">Tickets</span></h1>
                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Gestiona tus entradas</p>
            </div>
            <Link href="/dashboard" className="text-xs font-bold uppercase border-b-2 border-transparent hover:border-black transition-all">
                ← Volver a buscar
            </Link>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 font-black uppercase text-sm tracking-wider border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none
                ${activeTab === 'active' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
            >
                Activos ({activeBookings.length})
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 font-black uppercase text-sm tracking-wider border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none
                ${activeTab === 'history' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
            >
                Historial ({historyBookings.length})
            </button>
        </div>

        {/* LISTA DE ACTIVOS */}
        {activeTab === 'active' && (
            <div className="space-y-6">
                {activeBookings.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-gray-100 rounded-lg">
                        <p className="text-gray-400 font-black uppercase text-xl">Sin reservas activas</p>
                        <Link href="/dashboard" className="mt-4 inline-block bg-red-600 text-white px-6 py-3 font-bold uppercase text-xs tracking-wider hover:bg-black transition-colors">
                            Reservar Ahora
                        </Link>
                    </div>
                ) : (
                    activeBookings.map((booking) => (
                        <div key={booking.id} className="bg-white border-2 border-black flex flex-col md:flex-row overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform group">
                            
                            {/* INFO */}
                            <div className="p-6 flex-1 flex flex-col justify-between relative">
                                <div>
                                    <div className="inline-block bg-green-100 border border-green-300 text-green-800 text-[10px] font-black uppercase px-2 py-1 mb-2">
                                        ● Confirmado
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase leading-none mb-1">{booking.sport_spaces?.name}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase">📍 {booking.sport_spaces?.location}</p>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-dashed border-gray-200 pt-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha</p>
                                        <p className="font-bold text-lg">{booking.fecha}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Hora</p>
                                        <p className="font-bold text-lg">{booking.start_time?.slice(0,5)} Hrs</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center">
                                    <p className="font-black text-3xl text-red-600">${Number(booking.total || booking.total_price).toLocaleString()}</p>
                                    
                                    <button 
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b-2 border-transparent hover:text-red-600 hover:border-red-600 transition-all"
                                    >
                                        Cancelar Reserva
                                    </button>
                                </div>
                            </div>

                            {/* QR CODE PEQUEÑO */}
                            <div 
                                onClick={() => setExpandedQr(booking.id)} 
                                className="bg-gray-100 p-6 flex flex-col items-center justify-center border-t-2 md:border-t-0 md:border-l-2 border-black border-dashed relative cursor-zoom-in hover:bg-gray-200 transition-colors group-hover:bg-red-50"
                            >
                                <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-white md:hidden"></div>
                                
                                <div className="bg-white p-3 border-2 border-black pointer-events-none">
                                    <QRCode value={booking.id} size={100} />
                                </div>
                                <p className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center group-hover:text-red-600">
                                    🔍 Click para Zoom
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* LISTA HISTORIAL (Aquí agregamos el botón de Calificar) */}
        {activeTab === 'history' && (
            <div className="space-y-4">
                 {historyBookings.length === 0 ? (
                    <p className="text-center text-gray-400 font-bold uppercase py-10">Historial vacío</p>
                ) : (
                    historyBookings.map((booking) => (
                        <div key={booking.id} className={`bg-white border-2 border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center ${booking.status === 'completed' ? 'border-l-4 border-l-black' : 'opacity-60'}`}>
                            <div className="mb-2 sm:mb-0">
                                <h3 className="font-black text-gray-900 uppercase text-lg">{booking.sport_spaces?.name}</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase">{booking.fecha} • {booking.sport_spaces?.location}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {booking.status === 'completed' && (
                                    <>
                                        <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-wider">
                                            COMPLETADO
                                        </span>
                                        
                                        {/* Lógica: Si reviews tiene algo (length > 0), ya votó. Si no, botón votar */}
                                        {(!booking.reviews || booking.reviews.length === 0) ? (
                                            <button 
                                                onClick={() => setRatingModal({ 
                                                    open: true, 
                                                    bookingId: booking.id, 
                                                    gymId: booking.sport_spaces?.id 
                                                })}
                                                className="bg-yellow-400 text-black border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none"
                                            >
                                                ★ Calificar
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-yellow-600 uppercase">
                                                ★ Calificado
                                            </span>
                                        )}
                                    </>
                                )}
                                {booking.status === 'cancelled' && (
                                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 uppercase tracking-wider line-through">
                                        CANCELADO
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- MODAL EXPANDIDO DE QR (FULLSCREEN) --- */}
        {expandedQr && (
            <div 
                className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 cursor-zoom-out"
                onClick={() => setExpandedQr(null)}
            >
                <div 
                    className="bg-white p-6 rounded-3xl border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.2)] transform transition-transform scale-100"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <QRCode value={expandedQr} size={300} />
                </div>
                
                <p className="text-white font-black uppercase tracking-widest mt-8 animate-pulse">
                    Muestra este código al recepcionista
                </p>
                <p className="text-gray-500 text-xs font-bold uppercase mt-2">
                    Toca cualquier parte para cerrar
                </p>
            </div>
        )}

      </div>
    </div>
  );
}