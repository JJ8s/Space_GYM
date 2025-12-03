import { Gym } from '@/lib/types/gym';
import Link from 'next/link';
import Image from 'next/image';

interface GymCardProps {
  gym: Gym;
}

export default function GymCard({ gym }: GymCardProps) {
  return (
    <div className="group relative bg-white border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#dc2626] flex flex-col h-full">
      
      {/* --- ZONA DE IMAGEN --- */}
      <div className="relative h-56 w-full bg-gray-100 border-b-2 border-black">
        {gym.imageUrl ? (
          <Image 
            src={gym.imageUrl} 
            alt={gym.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
             <span className="text-4xl grayscale opacity-20">🏋️</span>
          </div>
        )}

        {/* Rating Flotante */}
        <div className="absolute top-3 right-3 bg-black text-white px-3 py-1 text-xs font-black uppercase -skew-x-12 border-2 border-white shadow-md z-10">
          ★ {gym.rating || 5.0}
        </div>
        
        {/* Badge de Verificado */}
        {gym.ownerProfile?.is_verified && (
            <div className="absolute bottom-3 left-3 bg-white text-black px-2 py-1 text-[10px] font-black uppercase border-2 border-black shadow-sm z-10">
                ✅ Verificado
            </div>
        )}
      </div>
      
      {/* --- CONTENIDO --- */}
      <div className="p-5 flex flex-col flex-grow">
        
        <div className="mb-1">
            <h3 className="font-black text-xl text-gray-900 leading-none italic uppercase tracking-tight line-clamp-1">
                {gym.name}
            </h3>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1 flex items-center gap-1">
                📍 {gym.location}
            </p>
        </div>
        
        {/* Amenities (Chips) */}
        <div className="flex flex-wrap gap-1 my-4 h-6 overflow-hidden">
           {gym.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">
                {a.split(' ')[0]}
              </span>
           ))}
           {gym.amenities.length > 3 && <span className="text-[10px] text-gray-400 font-bold">+{gym.amenities.length - 3}</span>}
        </div>

        {/* --- PIE DE TARJETA (PRECIO Y BOTÓN) --- */}
        <div className="mt-auto pt-4 border-t-2 border-gray-100 flex items-center justify-between gap-3">
          <div>
             <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Precio día</p>
             <p className="text-xl font-black text-red-600 tracking-tighter">
                ${gym.pricePerDay.toLocaleString()}
             </p>
          </div>
          
          {/* EL BOTÓN QUE FALTABA 👇 */}
          <Link 
            href={`/dashboard/gym/${gym.id}`}
            className="flex-1 bg-black text-white py-3 rounded-lg font-black text-xs uppercase tracking-wider text-center hover:bg-red-600 hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            Reservar →
          </Link>
        </div>

      </div>
    </div>
  );
}