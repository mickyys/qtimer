'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface EventCardProps {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  image?: string;
  sport?: string;
  participants?: number;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  onViewResults?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  description,
  date,
  time,
  location,
  image,
  sport,
  participants,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  onViewResults,
}) => {
  return (
    <Card className={cn(
      "w-full max-w-sm overflow-hidden transition-all duration-300",
      "hover:shadow-xl hover:scale-105 cursor-pointer",
      "bg-white/95 backdrop-blur border-slate-200"
    )} onClick={onClick}>
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-200 to-slate-300">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-2xl mb-2">🏃‍♂️</div>
              <p className="text-sm">Imagen no disponible</p>
            </div>
          </div>
        )}
        
        {/* Badge de deporte */}
        {sport && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-slate-900">
              {sport}
            </Badge>
          </div>
        )}

        {/* Botón de favoritos */}
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onFavoriteToggle?.();
          }}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
        >
          <Heart
            size={20}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}
          />
        </button>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight line-clamp-2">
          {title}
        </CardTitle>
        {location && (
          <CardDescription className="flex items-center gap-1 mt-1">
            📍 {location}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fecha y hora */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span className="font-medium">{time}</span>
          </div>
        </div>

        {/* Descripción */}
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {description}
          </p>
        )}

        {/* Participantes */}
        {participants !== undefined && (
          <div className="text-sm text-slate-600">
            👥 {participants} participantes
          </div>
        )}

        {/* Botón de acción */}
        <Button
          className="w-full mt-4"
          onClick={onViewResults}
        >
          Ver resultado
          Ver detalles
        </Button>
      </CardContent>
    </Card>
  );
};

export default EventCard;
