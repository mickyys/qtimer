"use client";

import { Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import { useModal } from '@/context/ModalContext';

interface ProcessedParticipant {
  position: number;
  name: string;
  bib: string;
  category: string;
  distance: string;
  time: string;
  pace: string;
  age: number;
  categoryPosition: number;
  city?: string;
  team?: string;
  chip?: string;
  sex?: string;
  splitTimes?: string[];
  personalBest?: string;
  previousRaces?: number;
}

interface ParticipantDetailModalProps {
  participant: ProcessedParticipant | null;
  onClose: () => void;
  firstPlace?: ProcessedParticipant;
  previousParticipants?: ProcessedParticipant[];
}

export default function ParticipantDetailModal({ 
  participant, 
  onClose, 
  firstPlace, 
  previousParticipants = [] 
}: ParticipantDetailModalProps) {
  const { setIsModalOpen } = useModal();

  useEffect(() => {
    setIsModalOpen(!!participant);
    
    return () => {
      setIsModalOpen(false);
    };
  }, [participant, setIsModalOpen]);

  if (!participant) return null;

  const handleClose = () => {
    onClose();
  };

  const handleShareWhatsApp = () => {
    // Crear URL con parámetros del participante
    const baseUrl = window.location.href.split('?')[0]; // Remover query params anteriores
    const shareUrl = `${baseUrl}?participantId=${encodeURIComponent(participant.name)}&position=${participant.position}&bib=${participant.bib}`;
    
    const text = encodeURIComponent(`¡Mira mis resultados en QuintaTimer! 🏃\n\n*${participant.name}*\nPosición: ${participant.position}°\nPosición Categoría: ${participant.categoryPosition}°\nTiempo: ${participant.time}\nRitmo: ${participant.pace}\n\nVer resultados: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={handleClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-6 text-white flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{participant.name}</h2>
            <p className="text-red-100 mt-1">{participant.category}</p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-red-100 text-sm mb-1">Pos. General</p>
                <p className="text-white text-xl font-bold">{participant.position}°</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-red-100 text-sm mb-1">Pos. Categoría</p>
                <p className="text-white text-xl font-bold">{participant.categoryPosition}°</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-red-100 text-sm mb-1">Tiempo</p>
                <p className="text-white text-xl font-bold">{participant.time}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-red-100 text-sm mb-1">Ritmo</p>
                <p className="text-white text-xl font-bold">{participant.pace}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Additional Details */}
          <div className="mb-6">
            <h3 className="text-gray-900 font-semibold mb-3">Información del Participante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Dorsal</p>
                <p className="text-gray-900 font-semibold">{participant.bib}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Distancia</p>
                <p className="text-gray-900 font-semibold">{participant.distance}</p>
              </div>
              {participant.city && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Ciudad</p>
                  <p className="text-gray-900 font-semibold">{participant.city}</p>
                </div>
              )}
              {participant.age && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-1">Edad</p>
                  <p className="text-gray-900 font-semibold">{participant.age}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Section */}
          {(firstPlace || previousParticipants.length > 0) && (
            <div className="mb-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Comparación de Tiempos
              </h3>
              
              <div className="space-y-2">
                {/* First Place */}
                {firstPlace && firstPlace.categoryPosition !== participant.categoryPosition && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-gray-900 font-semibold">{firstPlace.name}</p>
                          <p className="text-gray-600 text-sm">1° Lugar - {firstPlace.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-semibold">{firstPlace.time}</p>
                        <p className="text-gray-600 text-sm">{firstPlace.pace} </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Previous 5 Participants */}
                {previousParticipants.length > 0 && (
                  <>
                    <div className="pt-3 pb-2">
                      <p className="text-gray-600 text-sm font-semibold">Corredores anteriores</p>
                    </div>
                    {previousParticipants.map((p, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                              {p.categoryPosition}
                            </div>
                            <div>
                              <p className="text-gray-900 text-sm font-semibold">{p.name}</p>
                              <p className="text-gray-600 text-xs">{p.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 text-sm font-semibold">{p.time}</p>
                            <p className="text-gray-600 text-xs">{p.pace} </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Selected Participant Highlight */}
                <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {participant.categoryPosition}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">{participant.name}</p>
                        <p className="text-gray-600 text-sm">Tu posición - {participant.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-semibold">{participant.time}</p>
                      <p className="text-gray-600 text-sm">{participant.pace} </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Share Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.341-4.108 9.692-9.405 9.88zM20.947 3.037A11.83 11.83 0 0012.042 0C5.462 0 0.101 5.361 0.098 11.943c0 2.103.55 4.156 1.593 5.92L0 24l6.335-1.662a11.85 11.85 0 005.701 1.465h.005c6.579 0 11.94-5.361 11.943-11.942 0-3.19-1.242-6.189-3.486-8.435z" />
            </svg>
            WhatsApp
          </button>

        </div>
      </div>
    </div>
  );
}
