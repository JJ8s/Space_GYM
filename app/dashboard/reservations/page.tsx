"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import QRCode from "react-qr-code"; // IMPORTANTE
import Modal from '@/components/ui/Modal'; // Reutilizamos tu modal

export default function MyReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el QR
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, sport_spaces (name, location, image_url)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setReservations(data || []);
      setLoading(false);
    };

    if (!authLoading) fetchReservations();
  }, [user, authLoading]);

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <Link href="/dashboard" className="text-green-600 hover:underline">← Volver</Link>
        </div>

        <div className="grid gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="bg-white rounded-xl p-6 shadow-sm border flex flex-col md:flex-row gap-6 items-center">
              {/* ... (Imagen del gimnasio igual que antes) ... */}
              <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                 {res.sport_spaces?.image_url ? <img src={res.sport_spaces.image_url} className="w-full h-full object-cover"/> : null}
              </div>

              <div className="flex-grow">
                <h3 className="font-bold text-xl">{res.sport_spaces?.name}</h3>
                <p className="text-sm text-gray-500">Fecha: {res.fecha} - Hora: {res.hora}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                  res.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                  res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                }`}>
                  {res.status === 'completed' ? 'Asistencia Validada' : res.status}
                </span>
              </div>

              {/* BOTÓN QR: Solo si está confirmada */}
              {res.status === 'confirmed' && (
                <button 
                  onClick={() => setSelectedQr(res.id)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 flex items-center gap-2"
                >
                  📲 Ver QR Acceso
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DEL QR */}
      <Modal 
        open={!!selectedQr} 
        onClose={() => setSelectedQr(null)} 
        title="Tu Pase de Acceso"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 mb-4">
            {selectedQr && (
              <QRCode 
                value={selectedQr} // El valor del QR es el ID de la reserva
                size={200}
                level="H"
              />
            )}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Muestra este código al llegar al recinto.
          </p>
          <p className="text-xs text-gray-400 mt-2">ID: {selectedQr}</p>
        </div>
      </Modal>
    </div>
  );
}