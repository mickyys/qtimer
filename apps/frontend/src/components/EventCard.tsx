'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { getRankingPreviewUrl } from '@/utils/rankingLink';

interface EventCardProps {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location?: string;
  image?: string;
  rankingName?: string;
  rankingUrl?: string;
  sport?: string;
  participants?: number;
  modalities?: string[];
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
  rankingName,
  rankingUrl,
  sport,
  participants,
  modalities,
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
              <p className="text-sm">Sin imagen</p>
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
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span className="font-medium">{time}</span>
          </div>
          {(rankingName || rankingUrl) && (
            <div className="rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-3 py-2 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <FileText size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Ranking
                  </p>
                  {rankingUrl ? (
                    <a
                      href={getRankingPreviewUrl(rankingUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-red-700 transition-colors"
                      title="Abrir ranking"
                    >
                      <span className="truncate">{rankingName || 'Ver ranking'}</span>
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {rankingName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Descripción */}
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {description}
          </p>
        )}

        {/* Participantes */}
        {participants !== undefined && participants > 0 && (
          <div className="text-sm text-slate-600">
            👥 {participants} participantes
          </div>
        )}

        {/* Modalidades */}
        {modalities && modalities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">
              🏃‍♂️ Modalidades
            </div>
            <div className="flex flex-wrap gap-1">
              {modalities.slice(0, 8).map((modality, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-slate-50 text-slate-700 border-slate-200"
                >
                  {modality}
                </Badge>
              ))}
              {modalities.length > 8 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-100 text-slate-500 border-slate-300"
                >
                  +{modalities.length - 8} más
                </Badge>
              )}
            </div>
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
