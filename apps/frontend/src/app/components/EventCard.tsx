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
  const [expanded, setExpanded] = useState(false);

  const INITIAL_SHOW = 3;
  const hasOverflow = distances.length > INITIAL_SHOW;

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
        {participants > 0 && (
          <div className="absolute top-4 right-4">
            <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <Users className="w-4 h-4" />
              {participants}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-gray-900 mb-2">{title}</h3>

        {/* Distances */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {(expanded ? distances : distances.slice(0, INITIAL_SHOW)).map((d, i) => (
              <span
                key={i}
                className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm"
              >
                {d}
              </span>
            ))}
          </div>

          {hasOverflow && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              {expanded ? (
                <>Ver menos <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Ver más <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm">{date}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm">{time}</span>
          </div>

          { location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-red-600" />
              <span className="text-sm">{location}</span>
            </div>
          )}
        </div>

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
