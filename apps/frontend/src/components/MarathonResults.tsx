import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, Trophy, Medal, Award, ChevronDown, X, MapPin, Calendar, Timer, TrendingUp, User } from 'lucide-react';
import { getParticipantsBySlug, getParticipantComparison } from '../services/api';
import ParticipantDetailModal from './ParticipantDetailModal';

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
  event?: {
    id: string;
    name: string;
    date: string;
    time: string;
    address: string;
    imageUrl: string;
    fileName: string;
    fileExtension: string;
    status: string;
    createdAt: string;
  } | null;
}

export function MarathonResults({ eventSlug, event }: MarathonResultsProps) {
  const searchParams = useSearchParams();
  
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');
  const [searchBib, setSearchBib] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<ProcessedParticipant | null>(null);
  const [firstPlace, setFirstPlace] = useState<ProcessedParticipant | undefined>();
  const [previousParticipants, setPreviousParticipants] = useState<ProcessedParticipant[]>([]);
  const [participants, setParticipants] = useState<ProcessedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

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



  // Obtener distancias y categorías únicas de los datos, ordenadas alfabéticamente
  const distances = Array.from(new Set(participants.map(p => p.distance).filter(d => d !== 'N/A'))).sort();
  const categories = Array.from(new Set(participants.map(p => p.category).filter(c => c !== 'N/A'))).sort();

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Efecto combinado para debounce de todos los filtros
  useEffect(() => {
    // Cancelar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (eventSlug) {
    
      
      // Usar 500ms para búsquedas de texto, 300ms para filtros normales
      const delay = (searchName || searchBib) ? 500 : 300;
      
      debounceTimeoutRef.current = setTimeout(() => {
          setLoading(true);
        loadParticipantsWithFilters();
      }, delay);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchName, searchBib, selectedDistance, selectedCategory, eventSlug, loadParticipantsWithFilters]);

  // Efecto para leer query params y abrir el modal del participante
  useEffect(() => {
    const participantId = searchParams.get('participantId');
    const position = searchParams.get('position');
    
    if (participantId && participants.length > 0 && !selectedParticipant) {
      // Decodificar el nombre del participante desde la URL
      const decodedName = decodeURIComponent(participantId);
      
      // Buscar el participante por nombre o posición
      const foundParticipant = participants.find(
        p => p.name.toLowerCase() === decodedName.toLowerCase() ||
             (position && p.position === parseInt(position))
      );
      
      if (foundParticipant) {
        handleSelectParticipant(foundParticipant);
        
        // Actualizar metatags
        updateMetaTags(foundParticipant);
      }
    }
  }, [searchParams, participants, selectedParticipant]);

  // Función para actualizar metatags dinámicamente
  const updateMetaTags = (participant: ProcessedParticipant) => {
    const eventName = event?.name || 'QuintaTimer';
    const title = `${participant.name} - ${eventName} | Posición ${participant.position}°`;
    const description = `${participant.name} finalizó en posición ${participant.position}° en ${eventName}. Tiempo: ${participant.time} | Ritmo: ${participant.pace} min/km | Categoría: ${participant.category}`;
    const image = event?.imageUrl || `https://via.placeholder.com/1200x630?text=${encodeURIComponent(participant.name)}+%23${participant.position}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    // Actualizar og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    // Actualizar og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', description);

    // Actualizar og:image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', image);

    // Actualizar og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', url);

    // Actualizar twitter:title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', title);

    // Actualizar twitter:description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', description);

    // Actualizar twitter:image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', image);

    // Actualizar title de la página
    document.title = title;
  }

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

  // Obtener datos de comparación desde la base de datos
  const handleSelectParticipant = async (participant: ProcessedParticipant) => {
    setSelectedParticipant(participant);
    setLoadingComparison(true);
    
    try {
      const comparisonData = await getParticipantComparison(
        eventSlug,
        participant.bib,
        participant.distance
      );

      // Procesar los datos recibidos del servidor
      const processRawParticipant = (raw: Participant): ProcessedParticipant => {
        const data = raw.data;
        return {
          position: parseInt(data.POSICION || data.position || '0'),
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
        };
      };

      if (comparisonData.firstPlace) {
        setFirstPlace(processRawParticipant(comparisonData.firstPlace));
      }

      if (comparisonData.previousParticipants && comparisonData.previousParticipants.length > 0) {
        setPreviousParticipants(comparisonData.previousParticipants.map(processRawParticipant));
      } else {
        setPreviousParticipants([]);
      }
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      // Si falla, usar los datos locales
      const { firstPlace: localFirst, previousParticipants: localPrev } = getSurroundingParticipants(participant);
      setFirstPlace(localFirst);
      setPreviousParticipants(localPrev);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedParticipant(null);
    // Limpiar los parámetros de la URL
    window.history.replaceState({}, '', window.location.pathname);
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
          <h1 className="text-gray-900">Resultados de {event?.name || 'Maratón'}</h1>
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
                      onClick={() => handleSelectParticipant(participant)}
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
      {selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          onClose={handleCloseModal}
          firstPlace={firstPlace}
          previousParticipants={previousParticipants}
        />
      )}
    </div>
  );
}