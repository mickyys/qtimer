"use client";

import { EventCard } from "../components/EventCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Settings, Trophy, Loader2, AlertCircle } from "lucide-react";
import { getEvents } from "../../services/api";

// Interfaz para eventos del frontend
interface FrontendEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  status: string;
  distances: string[];
  participants: number;
  modalities: string[];
  slug: string;
}

// Función para mapear eventos del backend al formato del frontend
const mapBackendEventToFrontend = (backendEvent: any): FrontendEvent => {
  // Formatear la fecha
  const eventDate = new Date(backendEvent.date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return {
    title: backendEvent.name || 'Evento sin nombre',
    date: formattedDate,
    time: backendEvent.time || '09:00 hrs',
    location: backendEvent.address || 'Ubicación por determinar',
    imageUrl: backendEvent.imageUrl || '',
    status: backendEvent.status === 'active' ? 'Próximamente' : 
            backendEvent.status === 'finished' ? 'Finalizado' : 
            backendEvent.status === 'in_progress' ? 'En curso' : 'Próximamente',
    distances: ['5K', '10K', '21K'], // Valores por defecto, se podrían obtener del backend en el futuro
    participants: backendEvent.recordsCount || 0,
    modalities: backendEvent.uniqueModalities || [],
    slug: backendEvent.slug || '',
  };
};

export default function App() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<
    "events" | "results"
  >("events");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para los datos del servidor
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Función para cargar eventos del servidor
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Llamar al API para obtener eventos (página 1, sin filtros específicos)
      const response = await getEvents("", "", 1, 50);
      
      // Mapear los eventos del backend al formato del frontend
      const mappedEvents = response.events.map(mapBackendEventToFrontend);
      
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar eventos');
      // En caso de error, usar una lista vacía
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar eventos al montar el componente
  useEffect(() => {
    loadEvents();
  }, []);

  // Filtrar eventos basado en la búsqueda
  const filteredEvents = events.filter(
    (event) =>
      event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      event.location
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header with Logo and Admin Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-gray-900 text-xl">
                  QuintaTimer
                </h1>
                <p className="text-gray-600 text-sm">
                  Cronometraje deportivo
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Settings className="w-4 h-4" />
              Administrador
            </button>
          </div>
        </div>
      </div>




      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-gray-900">
                Maratones y Carreras
              </h2>
              <p className="text-gray-600 mt-2">
                Consulta los resultados de todas nuestras
                competiciones
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o ciudad..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                Total Eventos
              </p>
              <p className="text-red-600 text-2xl mt-1">
                {isLoading ? "-" : events.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                Total Participantes
              </p>
              <p className="text-gray-900 text-2xl mt-1">
                {isLoading ? "-" : events
                  .reduce(
                    (acc, e) => acc + e.participants,
                    0,
                  )
                  .toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                Próximos Eventos
              </p>
              <p className="text-gray-900 text-2xl mt-1">
                {isLoading ? "-" : events.filter(
                    (e) => e.status === "Próximamente",
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          // Estado de carga
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">
              Cargando eventos...
            </p>
          </div>
        ) : error ? (
          // Estado de error
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Error al cargar los eventos: {error}
            </p>
            <button
              onClick={loadEvents}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          // Eventos encontrados
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <EventCard
                key={index}
                title={event.title}
                date={event.date}
                time={event.time}
                location={event.location}
                imageUrl={event.imageUrl}
                status={event.status || 'Próximo'}
                participants={event.participants}
                distances={event.modalities}
                onViewResults={() =>
                  router.push(`/events/${event.slug}`)
                }
              />
            ))}
          </div>
        ) : (
          // No se encontraron eventos
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 
                `No se encontraron eventos con "${searchQuery}"` :
                "No hay eventos disponibles"
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-red-600 hover:text-red-700"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}