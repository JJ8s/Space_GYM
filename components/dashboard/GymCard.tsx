import { Gym } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image'; // <--- Importamos Image

interface GymCardProps {
  gym: Gym;
}

export default function GymCard({ gym }: GymCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      
      {/* ZONA DE IMAGEN */}
      <div className="relative h-48 w-full bg-gray-100">
        {gym.imageUrl ? (
          // SI HAY FOTO: La mostramos
          <Image 
            src={gym.imageUrl} 
            alt={gym.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // SI NO HAY FOTO: Mostramos el degradado de siempre
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
             <span className="text-white font-bold text-2xl opacity-50">{gym.name.charAt(0)}</span>
          </div>
        )}

        {/* Rating Flotante */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm z-10">
          <span className="text-yellow-500 text-xs">★</span>
          <span className="text-gray-800 text-xs font-bold">{gym.rating || 5.0}</span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{gym.name}</h3>
        <p className="text-gray-500 text-xs mb-3">{gym.location}</p>
        
        <div className="flex items-center justify-between mb-3 mt-auto">
          <div>
             <span className="text-xl font-bold text-green-600">
                ${gym.pricePerDay.toLocaleString()}
             </span>
             <span className="text-[10px] text-gray-400 font-medium ml-1">/ día</span>
          </div>
        </div>

        {/* Amenities Resumen */}
        <div className="flex gap-1 mb-4 overflow-hidden">
           {gym.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {a.split(' ')[0]} {/* Muestra solo el emoji o primera palabra */}
              </span>
           ))}
        </div>

        <Link 
          href={`/dashboard/gym/${gym.id}`}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition-colors text-center text-sm"
        >
          Ver Detalles y Reservar
        </Link>
      </div>
    </div>
  );
}