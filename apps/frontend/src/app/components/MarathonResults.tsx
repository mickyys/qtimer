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

const mockParticipants: Participant[] = [
  // 5K - Senior A Varones
  { position: 1, name: 'Carlos Rodríguez', bib: '001', category: 'Senior A Varones', distance: '5K', time: '16:23', pace: '3:17', age: 28, categoryPosition: 1, city: 'Madrid', team: 'Club Atlético Madrid', splitTimes: ['8:10', '8:13'], personalBest: '15:58', previousRaces: 12 },
  { position: 2, name: 'Miguel Santos', bib: '015', category: 'Senior A Varones', distance: '5K', time: '16:45', pace: '3:21', age: 26, categoryPosition: 2, city: 'Barcelona', team: 'Runners BCN', splitTimes: ['8:20', '8:25'], personalBest: '16:20', previousRaces: 8 },
  { position: 3, name: 'Pedro Martínez', bib: '023', category: 'Senior A Varones', distance: '5K', time: '17:12', pace: '3:26', age: 29, categoryPosition: 3, city: 'Valencia', team: 'Valencia Running', splitTimes: ['8:35', '8:37'], personalBest: '16:45', previousRaces: 15 },
  { position: 4, name: 'Luis García', bib: '034', category: 'Senior A Varones', distance: '5K', time: '17:38', pace: '3:32', age: 27, categoryPosition: 4, city: 'Sevilla', team: 'Independiente', splitTimes: ['8:48', '8:50'], personalBest: '17:10', previousRaces: 6 },
  { position: 5, name: 'Antonio López', bib: '042', category: 'Senior A Varones', distance: '5K', time: '17:55', pace: '3:35', age: 25, categoryPosition: 5, city: 'Bilbao', team: 'Athletic Bilbao Running', splitTimes: ['8:55', '9:00'], personalBest: '17:30', previousRaces: 10 },
  { position: 6, name: 'Jorge Moreno', bib: '045', category: 'Senior A Varones', distance: '5K', time: '18:10', pace: '3:38', age: 28, categoryPosition: 6, city: 'Madrid', team: 'Independiente', splitTimes: ['9:05', '9:05'], personalBest: '17:45', previousRaces: 9 },
  { position: 7, name: 'Daniel Silva', bib: '047', category: 'Senior A Varones', distance: '5K', time: '18:25', pace: '3:41', age: 27, categoryPosition: 7, city: 'Barcelona', team: 'Runners BCN', splitTimes: ['9:12', '9:13'], personalBest: '18:00', previousRaces: 11 },
  { position: 8, name: 'Alberto Ramos', bib: '049', category: 'Senior A Varones', distance: '5K', time: '18:38', pace: '3:44', age: 26, categoryPosition: 8, city: 'Valencia', team: 'Valencia Running', splitTimes: ['9:18', '9:20'], personalBest: '18:15', previousRaces: 7 },
  { position: 9, name: 'Raúl Fernández', bib: '051', category: 'Senior A Varones', distance: '5K', time: '18:52', pace: '3:46', age: 29, categoryPosition: 9, city: 'Sevilla', team: 'Independiente', splitTimes: ['9:25', '9:27'], personalBest: '18:30', previousRaces: 13 },
  { position: 10, name: 'Pablo Hernández', bib: '053', category: 'Senior A Varones', distance: '5K', time: '19:05', pace: '3:49', age: 28, categoryPosition: 10, city: 'Madrid', team: 'Club Running', splitTimes: ['9:30', '9:35'], personalBest: '18:45', previousRaces: 8 },
  
  // 5K - Todo Competidor Varones
  { position: 1, name: 'Juan Pérez', bib: '052', category: 'Todo Competidor Varones', distance: '5K', time: '18:30', pace: '3:42', age: 35, categoryPosition: 1, city: 'Zaragoza', team: 'Independiente', splitTimes: ['9:10', '9:20'], personalBest: '18:00', previousRaces: 5 },
  { position: 2, name: 'Roberto Díaz', bib: '063', category: 'Todo Competidor Varones', distance: '5K', time: '19:15', pace: '3:51', age: 42, categoryPosition: 2, city: 'Málaga', team: 'Costa del Sol Runners', splitTimes: ['9:35', '9:40'], personalBest: '18:45', previousRaces: 20 },
  { position: 3, name: 'Fernando Torres', bib: '078', category: 'Todo Competidor Varones', distance: '5K', time: '19:45', pace: '3:57', age: 38, categoryPosition: 3, city: 'Granada', team: 'Independiente', splitTimes: ['9:50', '9:55'], personalBest: '19:15', previousRaces: 7 },
  { position: 4, name: 'Javier Ruiz', bib: '089', category: 'Todo Competidor Varones', distance: '5K', time: '20:12', pace: '4:02', age: 45, categoryPosition: 4, city: 'Murcia', team: 'Veteranos Murcia', splitTimes: ['10:05', '10:07'], personalBest: '19:50', previousRaces: 25 },
  
  // 5K - Senior A Damas
  { position: 1, name: 'María González', bib: '102', category: 'Senior A Damas', distance: '5K', time: '18:45', pace: '3:45', age: 26, categoryPosition: 1, city: 'Madrid', team: 'Féminas Madrid', splitTimes: ['9:20', '9:25'], personalBest: '18:20', previousRaces: 9 },
  { position: 2, name: 'Ana Fernández', bib: '115', category: 'Senior A Damas', distance: '5K', time: '19:20', pace: '3:52', age: 28, categoryPosition: 2, city: 'Barcelona', team: 'She Runs BCN', splitTimes: ['9:40', '9:40'], personalBest: '18:55', previousRaces: 11 },
  { position: 3, name: 'Laura Sánchez', bib: '127', category: 'Senior A Damas', distance: '5K', time: '19:50', pace: '3:58', age: 27, categoryPosition: 3, city: 'Alicante', team: 'Independiente', splitTimes: ['9:55', '9:55'], personalBest: '19:25', previousRaces: 6 },
  { position: 4, name: 'Carmen Ramírez', bib: '138', category: 'Senior A Damas', distance: '5K', time: '20:25', pace: '4:05', age: 25, categoryPosition: 4, city: 'Córdoba', team: 'Running Córdoba', splitTimes: ['10:10', '10:15'], personalBest: '19:58', previousRaces: 8 },
  
  // 10K - Senior A Varones
  { position: 1, name: 'Diego Morales', bib: '201', category: 'Senior A Varones', distance: '10K', time: '34:12', pace: '3:25', age: 28, categoryPosition: 1, city: 'Madrid', team: 'Elite Runners', splitTimes: ['17:00', '17:12'], personalBest: '33:45', previousRaces: 18 },
  { position: 2, name: 'Sergio Jiménez', bib: '215', category: 'Senior A Varones', distance: '10K', time: '35:30', pace: '3:33', age: 29, categoryPosition: 2, city: 'Barcelona', team: 'Pro Running BCN', splitTimes: ['17:40', '17:50'], personalBest: '34:55', previousRaces: 14 },
  { position: 3, name: 'Ricardo Vega', bib: '228', category: 'Senior A Varones', distance: '10K', time: '36:15', pace: '3:38', age: 27, categoryPosition: 3, city: 'Valencia', team: 'Valencia Elite', splitTimes: ['18:05', '18:10'], personalBest: '35:40', previousRaces: 10 },
  { position: 4, name: 'Andrés Castro', bib: '242', category: 'Senior A Varones', distance: '10K', time: '37:05', pace: '3:42', age: 26, categoryPosition: 4, city: 'Sevilla', team: 'Independiente', splitTimes: ['18:30', '18:35'], personalBest: '36:20', previousRaces: 7 },
  
  // 10K - Todo Competidor Varones
  { position: 1, name: 'Francisco Herrera', bib: '305', category: 'Todo Competidor Varones', distance: '10K', time: '38:45', pace: '3:52', age: 36, categoryPosition: 1, city: 'Salamanca', team: 'Salamanca Corre', splitTimes: ['19:20', '19:25'], personalBest: '37:55', previousRaces: 16 },
  { position: 2, name: 'Gabriel Ortiz', bib: '318', category: 'Todo Competidor Varones', distance: '10K', time: '40:20', pace: '4:02', age: 40, categoryPosition: 2, city: 'Toledo', team: 'Independiente', splitTimes: ['20:10', '20:10'], personalBest: '39:30', previousRaces: 22 },
  { position: 3, name: 'Manuel Reyes', bib: '329', category: 'Todo Competidor Varones', distance: '10K', time: '41:30', pace: '4:09', age: 43, categoryPosition: 3, city: 'Cádiz', team: 'Costa Runners', splitTimes: ['20:45', '20:45'], personalBest: '40:50', previousRaces: 19 },
  
  // 10K - Senior A Damas
  { position: 1, name: 'Patricia Flores', bib: '402', category: 'Senior A Damas', distance: '10K', time: '39:15', pace: '3:55', age: 27, categoryPosition: 1, city: 'Madrid', team: 'Women Run Madrid', splitTimes: ['19:35', '19:40'], personalBest: '38:45', previousRaces: 13 },
  { position: 2, name: 'Isabel Navarro', bib: '415', category: 'Senior A Damas', distance: '10K', time: '40:50', pace: '4:05', age: 28, categoryPosition: 2, city: 'Girona', team: 'Girona Running', splitTimes: ['20:25', '20:25'], personalBest: '40:10', previousRaces: 11 },
  { position: 3, name: 'Claudia Mendoza', bib: '428', category: 'Senior A Damas', distance: '10K', time: '42:10', pace: '4:13', age: 26, categoryPosition: 3, city: 'Tarragona', team: 'Independiente', splitTimes: ['21:05', '21:05'], personalBest: '41:30', previousRaces: 8 },
];

export function MarathonResults() {
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Simulating many distances - you can expand this list
  const distances = ['5K', '10K', '15K', '21K', '42K', '50K', '100K', '5 Millas', '10 Millas'];
  const categories = ['Senior A Varones', 'Todo Competidor Varones', 'Senior A Damas'];

  const filteredParticipants = mockParticipants.filter(participant => {
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
    const sameDistance = mockParticipants.filter(p => p.distance === participant.distance);
    const firstPlace = sameDistance[0];
    
    // Get 5 participants before the selected one
    const participantIndex = sameDistance.findIndex(p => p.position === participant.position);
    const startIndex = Math.max(0, participantIndex - 5);
    const previousParticipants = sameDistance.slice(startIndex, participantIndex);
    
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
                      <td className="px-6 py-4 text-gray-600">{participant.pace} min/km</td>
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