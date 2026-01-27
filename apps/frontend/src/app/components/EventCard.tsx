import { Calendar, MapPin, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  status: string;
  distances: string[];
  participants: number;
  onViewResults: () => void;
}

export function EventCard({
  title,
  date,
  time,
  location,
  imageUrl,
  status,
  distances = [],
  participants,
  onViewResults
}: EventCardProps) {
  const [expandedDistances, setExpandedDistances] = useState(false);
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-sm">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-2xl mb-2">🏃‍♂️</div>
              <p className="text-sm">Sin imagen</p>
            </div>
          </div>
        )}
        {participants !== undefined && participants > 0 && (
          <div className="absolute top-4 right-4">
            <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <Users className="w-4 h-4" />
              {participants}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Distances */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {(expandedDistances ? distances : distances.slice(0, 1)).map((distance, index) => (
              <span key={index} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                {distance}
              </span>
            ))}
          </div>
          {distances.length > 1 && (
            <button
              onClick={() => setExpandedDistances(!expandedDistances)}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              {expandedDistances ? (
                <>
                  Ver menos <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver más ({distances.length - 1}) <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm">{date}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm">{time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm">{location}</span>
          </div>
        </div>

        {/* Button */}
        <div className="pt-4 border-t border-gray-200">
          <button 
            onClick={onViewResults}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Ver Resultados
          </button>
        </div>
      </div>
    </div>
  );
}