"use client";

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface RateModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  gymId: string;
  onSuccess: () => void;
}

export default function RateModal({ isOpen, onClose, bookingId, gymId, onSuccess }: RateModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return toast.error("Selecciona al menos 1 estrella");
    setLoading(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No usuario");

        const { error } = await supabase.from('reviews').insert({
            user_id: user.id,
            gym_id: gymId,
            booking_id: bookingId,
            rating: rating,
            comment: comment
        });

        if (error) throw error;

        toast.success("¡Gracias por tu opinión!");
        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        toast.error("Error al guardar calificación");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-black p-4 flex justify-between items-center text-white">
            <h3 className="font-black italic uppercase text-lg">Calificar Experiencia</h3>
            <button onClick={onClose}><X size={20}/></button>
        </div>

        {/* Estrellas */}
        <div className="p-6 text-center">
            <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(rating)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star 
                            size={32} 
                            fill={star <= (hover || rating) ? "#FFD700" : "transparent"} 
                            color={star <= (hover || rating) ? "#FFD700" : "#E5E7EB"} 
                            strokeWidth={3}
                        />
                    </button>
                ))}
            </div>
            
            <p className="font-bold text-sm text-gray-500 uppercase mb-4">
                {rating === 5 ? "¡Excelente!" : rating === 4 ? "Muy bueno" : rating === 3 ? "Regular" : rating > 0 ? "Malo" : "Toca las estrellas"}
            </p>

            <textarea 
                className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-black font-medium"
                rows={3}
                placeholder="Escribe un comentario (opcional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            <button 
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-black uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
            >
                {loading ? "Enviando..." : "Enviar Calificación"}
            </button>
        </div>
      </div>
    </div>
  );
}