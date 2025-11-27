import { Gym } from '@/lib/types';
import Link from 'next/link';
interface GymCardProps {
  gym: Gym;
  onReserve: (gym: Gym) => void;
}

export default function GymCard({ gym, onReserve }: GymCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
        <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-lg">
          {gym.name.split(' ')[0]}
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="text-gray-800 text-sm font-medium">{gym.rating}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{gym.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{gym.location}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-green-600">
            ${gym.pricePerDay.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">por día</span>
        </div>

        <div className="space-y-2 mb-4">
          {gym.amenities.slice(0, 3).map((amenity, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {amenity}
            </div>
          ))}
        </div>

        <Link 
        href={`/dashboard/gym/${gym.id}`}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 text-center block"
        >
        Ver Detalles & Reservar
        </Link>
      </div>
    </div>
  );
}