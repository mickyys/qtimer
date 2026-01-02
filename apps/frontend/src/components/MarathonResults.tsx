import { useState, useEffect, useCallback, useRef } from 'react';
import { Filter, Trophy, Medal, Award, ChevronDown, X, MapPin, Calendar, Timer, TrendingUp, User } from 'lucide-react';
import { getParticipantsBySlug } from '../services/api';

interface Participant {
  id: string;
  eventId: string;
  data: {
    [key: string]: string;
  };
}

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

// Función para capitalizar nombres
const capitalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface MarathonResultsProps {
  eventSlug: string;
}

export function MarathonResults({ eventSlug }: MarathonResultsProps) {
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [searchBib, setSearchBib] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<ProcessedParticipant | null>(null);
  const [participants, setParticipants] = useState<ProcessedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para procesar los datos del backend
  const processParticipants = (rawParticipants: Participant[]): ProcessedParticipant[] => {
    return rawParticipants.map((participant, index) => {
      const data = participant.data;
      
      return {
        position: parseInt(data.POSICION || data.position || (index + 1).toString()),
        name: capitalizeString(data.NOMBRE || data.name || data.nombre || 'N/A'),
        bib: data.DORSAL || data.bib || data.dorsal || 'N/A',
        category: capitalizeString(data.CATEGORIA || data.category || data.categoria || 'N/A'),
        distance: capitalizeString(data.MODALIDAD || data.distance || data.distancia || 'N/A'),
        time: data.TIEMPO || data.time || data.tiempo || 'N/A',
        pace: data.RITMO || data.pace || data.ritmo || 'N/A',
        age: parseInt(data.EDAD || data.age || data.edad || '0'),
        categoryPosition: parseInt(data['POS.CAT.'] || data.categoryPosition || data.posicionCategoria || '0'),
        city: capitalizeString(data.CIUDAD || data.city || data.ciudad || ''),
        team: capitalizeString(data.EQUIPO || data.team || data.equipo || ''),
        chip: data.CHIP || data.chip,
        sex: capitalizeString(data.SEXO || data.sex || data.sexo || ''),
        splitTimes: data.splitTimes ? data.splitTimes.split(',') : undefined,
        personalBest: data.personalBest || data.mejorTiempo,
        previousRaces: data.previousRaces ? parseInt(data.previousRaces) : undefined
      };
    });
  };



  // Obtener distancias y categorías únicas de los datos
  const distances = Array.from(new Set(participants.map(p => p.distance).filter(d => d !== 'N/A')));
  const categories = Array.from(new Set(participants.map(p => p.category).filter(c => c !== 'N/A')));

  // Función para cargar participantes con filtros
  const loadParticipantsWithFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir objeto de filtros para la API
      const filters: { [key: string]: string } = {};
      if (selectedDistance !== 'all') filters.distance = selectedDistance;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (searchName.trim() !== '') filters.name = searchName.trim();
      if (searchBib.trim() !== '') filters.dorsal = searchBib.trim();
      
      const response = await getParticipantsBySlug(eventSlug, filters, 1, 1000);
      const processedData = processParticipants(response.participants);
      setParticipants(processedData);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar participantes');
    } finally {
      setLoading(false);
    }
  }, [eventSlug, selectedDistance, selectedCategory, searchName, searchBib]);

  // Ref para el timeout del debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const filterTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce para búsquedas de texto (500ms)
  useEffect(() => {
    // Cancelar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (eventSlug && (searchName || searchBib)) {
      // Mostrar loading mientras se espera
      setLoading(true);
      
      searchTimeoutRef.current = setTimeout(() => {
        loadParticipantsWithFilters();
      }, 500); // Esperar 500ms después de que el usuario deje de escribir
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchName, searchBib, eventSlug]);

  // Debounce para cambios en filtros de selección (300ms)
  useEffect(() => {
    // Cancelar timeout anterior
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    if (eventSlug) {
      setLoading(true);
      
      filterTimeoutRef.current = setTimeout(() => {
        loadParticipantsWithFilters();
      }, 300); // Esperar 300ms para permitir cambios rápidos de filtros
    }

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [selectedDistance, selectedCategory, eventSlug]);

  // Los participantes mostrados ahora son todos los que vienen del servidor
  const filteredParticipants = participants;

  // Función para manejar entrada numérica del dorsal
  const handleBibChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    setSearchBib(numericValue);
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get surrounding participants for comparison
  const getSurroundingParticipants = (participant: ProcessedParticipant) => {
    const sameDistance = participants.filter(p => p.distance === participant.distance);
    const firstPlace = sameDistance[0];
    
    // Get 5 participants before the selected one
    const participantIndex = sameDistance.findIndex(p => p.position === participant.position);
    const startIndex = Math.max(0, participantIndex - 5);
    const previousParticipants = sameDistance.slice(startIndex, participantIndex);
    
    return { firstPlace, previousParticipants };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar resultados</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-gray-900">Resultados de Maratón</h1>
          <p className="text-gray-600 mt-2">Consulta los resultados y posiciones de los participantes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-red-600" />
            <h2 className="text-gray-900">Filtros</h2>
          </div>

          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Search by Name */}
            <div>
              <label className="block text-gray-700 mb-3">Buscar por Nombre</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Escribe el nombre del participante..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                />
                {loading && searchName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search by Bib (Dorsal) */}
            <div>
              <label className="block text-gray-700 mb-3">Buscar por Dorsal</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={searchBib}
                  onChange={(e) => handleBibChange(e.target.value)}
                  placeholder="Escribe el número de dorsal..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                />

                {loading && searchBib && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distance Filter - Dynamic: select if more than 4, buttons if 4 or less */}
            <div>
              <label className="block text-gray-700 mb-3">Distancia</label>
              {distances.length > 4 ? (
                <div className="relative">
                  <select
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer text-gray-700 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                  >
                    <option value="all">Todas las distancias</option>
                    {distances.map(distance => (
                      <option key={distance} value={distance}>
                        {distance}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDistance('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedDistance === 'all'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {distances.map(distance => (
                    <button
                      key={distance}
                      onClick={() => setSelectedDistance(distance)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                        selectedDistance === distance
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {distance}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter - Dynamic: select if more than 4, buttons if 4 or less */}
            <div>
              <label className="block text-gray-700 mb-3">Categoría</label>
              {categories.length > 4 ? (
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer text-gray-700 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                        selectedCategory === category
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-sm">
                {(selectedDistance !== 'all' || selectedCategory !== 'all' || searchName !== '' || searchBib !== '') ? (
                  <>Encontrados: <span className="text-red-600 font-semibold">{filteredParticipants.length}</span> participantes</>
                ) : (
                  <>Total: <span className="text-red-600 font-semibold">{filteredParticipants.length}</span> participantes</>
                )}
              </p>
              {loading && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
                  Buscando...
                </div>
              )}
            </div>
            
            {/* Clear Filters Button */}
            {(selectedDistance !== 'all' || selectedCategory !== 'all' || searchName !== '' || searchBib !== '') && (
              <button
                onClick={() => {
                  setSelectedDistance('all');
                  setSelectedCategory('all');
                  setSearchName('');
                  setSearchBib('');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-700">Pos.</th>
                  <th className="px-6 py-4 text-left text-gray-700">Pos. Cat.</th>
                  <th className="px-6 py-4 text-left text-gray-700">Dorsal</th>
                  <th className="px-6 py-4 text-left text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-gray-700">Distancia</th>
                  <th className="px-6 py-4 text-left text-gray-700">Sexo</th>
                  <th className="px-6 py-4 text-left text-gray-700">Tiempo</th>
                  <th className="px-6 py-4 text-left text-gray-700">Ritmo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant, index) => (
                    <tr 
                      key={index}
                      onClick={() => setSelectedParticipant(participant)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getMedalIcon(participant.position)}
                          <span className="text-gray-900">{participant.position}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{participant.categoryPosition}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {participant.bib}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{participant.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{participant.category}</td>
                      <td className="px-6 py-4">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                          {participant.distance}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{participant.sex || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-900">{participant.time}</td>
                      <td className="px-6 py-4 text-gray-600">{participant.pace} min/km</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron resultados con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {selectedParticipant && (() => {
        const { firstPlace, previousParticipants } = getSurroundingParticipants(selectedParticipant);
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header with Close Button */}
            <div className="relative bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="text-white">
                <h2 className="text-white mb-1">{selectedParticipant.name}</h2>
                <p className="text-red-100 mb-4">{selectedParticipant.category}</p>
                
                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-red-100 text-sm mb-1">Pos. General</p>
                    <p className="text-white text-xl">{selectedParticipant.position}°</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-red-100 text-sm mb-1">Pos. Categoría</p>
                    <p className="text-white text-xl">{selectedParticipant.categoryPosition}°</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-red-100 text-sm mb-1">Tiempo</p>
                    <p className="text-white text-xl">{selectedParticipant.time}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-red-100 text-sm mb-1">Ritmo</p>
                    <p className="text-white text-xl">{selectedParticipant.pace}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Comparison Section */}
              <div className="mb-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-red-600" />
                  Comparación de Tiempos
                </h3>
                
                <div className="space-y-2">
                  {/* First Place */}
                  {firstPlace && firstPlace.position !== selectedParticipant.position && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <div>
                            <p className="text-gray-900">{firstPlace.name}</p>
                            <p className="text-gray-600 text-sm">1° Lugar - {firstPlace.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">{firstPlace.time}</p>
                          <p className="text-gray-600 text-sm">{firstPlace.pace} min/km</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Previous 5 Participants */}
                  {previousParticipants.length > 0 && (
                    <>
                      <div className="pt-3">
                        <p className="text-gray-600 text-sm mb-2">Corredores anteriores</p>
                      </div>
                      {previousParticipants.map((p, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                                {p.position}
                              </div>
                              <div>
                                <p className="text-gray-900 text-sm">{p.name}</p>
                                <p className="text-gray-600 text-xs">{p.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-900 text-sm">{p.time}</p>
                              <p className="text-gray-600 text-xs">{p.pace} min/km</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Selected Participant */}
                  <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          {selectedParticipant.position}
                        </div>
                        <div>
                          <p className="text-gray-900">{selectedParticipant.name}</p>
                          <p className="text-gray-600 text-sm">Tú - {selectedParticipant.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900">{selectedParticipant.time}</p>
                        <p className="text-gray-600 text-sm">{selectedParticipant.pace} min/km</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}