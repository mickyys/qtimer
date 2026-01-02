import { useState } from 'react';
import { Filter, Trophy, Medal, Award, ChevronDown, X, MapPin, Calendar, Timer, TrendingUp, User } from 'lucide-react';

interface Participant {
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
  splitTimes?: string[];
  personalBest?: string;
  previousRaces?: number;
}

interface MarathonResultsProps {
  participants?: Participant[];
}

export function MarathonResults({ participants = [] }: MarathonResultsProps) {
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Simulating many distances - you can expand this list
  const distances = ['5K', '10K', '15K', '21K', '42K', '50K', '100K', '5 Millas', '10 Millas'];
  const categories = ['Senior A Varones', 'Todo Competidor Varones', 'Senior A Damas'];

  const filteredParticipants = participants.filter(participant => {
    const distanceMatch = selectedDistance === 'all' || participant.distance === selectedDistance;
    const categoryMatch = selectedCategory === 'all' || participant.category === selectedCategory;
    return distanceMatch && categoryMatch;
  });

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get surrounding participants for comparison
  const getSurroundingParticipants = (participant: Participant) => {
    const sameCategoryAndDistance = participants.filter(
      p => p.distance === participant.distance && p.category === participant.category
    );
    const firstPlace = sameCategoryAndDistance.length > 0 ? sameCategoryAndDistance[0] : null;
    
    // Get 5 participants before the selected one
    const participantIndex = sameCategoryAndDistance.findIndex(
      p => p.categoryPosition === participant.categoryPosition
    );
    const startIndex = Math.max(0, participantIndex - 5);
    const previousParticipants = sameCategoryAndDistance.slice(startIndex, participantIndex);
    
    return { firstPlace, previousParticipants };
  };

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distance Filter - Dropdown for many options */}
            <div>
              <label className="block text-gray-700 mb-3">Distancia</label>
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
            </div>

            {/* Category Filter - Buttons for fewer options */}
            <div>
              <label className="block text-gray-700 mb-3">Categoría</label>
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
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Mostrando <span className="text-red-600">{filteredParticipants.length}</span> resultados
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-700">Pos.</th>
                  <th className="px-6 py-4 text-left text-gray-700">Dorsal</th>
                  <th className="px-6 py-4 text-left text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-gray-700">Distancia</th>
                  <th className="px-6 py-4 text-left text-gray-700">Edad</th>
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
                      <td className="px-6 py-4 text-gray-600">{participant.age}</td>
                      <td className="px-6 py-4 text-gray-900">{participant.time}</td>
                      <td className="px-6 py-4 text-gray-600">{participant.pace} </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
                          <p className="text-gray-600 text-sm">{firstPlace.pace} </p>
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
                              <p className="text-gray-600 text-xs">{p.pace} </p>
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
                        <p className="text-gray-600 text-sm">{selectedParticipant.pace} </p>
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