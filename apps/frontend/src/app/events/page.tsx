"use client";

import { EventCard } from "../components/EventCard";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Settings, Trophy } from "lucide-react";

const marathons = [
  {
    title: "Maratón Internacional de Madrid",
    date: "15 Marzo 2025",
    time: "08:00 hrs",
    location: "Madrid, España",
    imageUrl:
      "https://images.unsplash.com/photo-1667781838690-5f32ea0ccea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJhdGhvbiUyMHJ1bm5lcnN8ZW58MXx8fHwxNzY2OTIwODExfDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Finalizado",
    distances: ["5K", "10K", "21K", "42K"],
    participants: 15420,
  },
  {
    title: "Maratón de Barcelona",
    date: "22 Marzo 2025",
    time: "07:30 hrs",
    location: "Barcelona, España",
    imageUrl:
      "https://images.unsplash.com/photo-1730045768278-bb87a2939e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwbWFyYXRob258ZW58MXx8fHwxNzY2OTc0NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Finalizado",
    distances: ["10K", "21K", "42K"],
    participants: 12850,
  },
  {
    title: "Trail Running Sierra Nevada",
    date: "5 Abril 2025",
    time: "09:00 hrs",
    location: "Granada, España",
    imageUrl:
      "https://images.unsplash.com/photo-1530143311094-34d807799e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFpbCUyMHJ1bm5pbmd8ZW58MXx8fHwxNzY2OTc0NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Próximamente",
    distances: ["15K", "30K", "50K"],
    participants: 8950,
  },
  {
    title: "Media Maratón de Valencia",
    date: "12 Abril 2025",
    time: "08:30 hrs",
    location: "Valencia, España",
    imageUrl:
      "https://images.unsplash.com/photo-1667781838690-5f32ea0ccea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJhdGhvbiUyMHJ1bm5lcnN8ZW58MXx8fHwxNzY2OTIwODExfDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Finalizado",
    distances: ["5K", "10K", "21K"],
    participants: 9320,
  },
  {
    title: "Maratón de Sevilla",
    date: "20 Abril 2025",
    time: "08:00 hrs",
    location: "Sevilla, España",
    imageUrl:
      "https://images.unsplash.com/photo-1730045768278-bb87a2939e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwbWFyYXRob258ZW58MXx8fHwxNzY2OTc0NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Próximamente",
    distances: ["10K", "21K", "42K"],
    participants: 11200,
  },
  {
    title: "Carrera Popular Bilbao",
    date: "28 Abril 2025",
    time: "10:00 hrs",
    location: "Bilbao, España",
    imageUrl:
      "https://images.unsplash.com/photo-1667781838690-5f32ea0ccea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJhdGhvbiUyMHJ1bm5lcnN8ZW58MXx8fHwxNzY2OTIwODExfDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Finalizado",
    distances: ["5K", "10K"],
    participants: 6780,
  },
];

export default function App() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<
    "events" | "results"
  >("events");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMarathons = marathons.filter(
    (marathon) =>
      marathon.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      marathon.location
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

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            <button
              onClick={() => setCurrentView("events")}
              className={`px-6 py-4 transition-colors border-b-2 ${
                currentView === "events"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Maratones
            </button>
            <button
              onClick={() => setCurrentView("results")}
              className={`px-6 py-4 transition-colors border-b-2 ${
                currentView === "results"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Resultados
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {currentView === "events" && (
        <>
          {/* Header with Search */}
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
                    Total Maratones
                  </p>
                  <p className="text-red-600 text-2xl mt-1">
                    {marathons.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">
                    Total Participantes
                  </p>
                  <p className="text-gray-900 text-2xl mt-1">
                    {marathons
                      .reduce(
                        (acc, m) => acc + m.participants,
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
                    {
                      marathons.filter(
                        (m) => m.status === "Próximamente",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="max-w-7xl mx-auto px-4 py-12">
            {filteredMarathons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMarathons.map((marathon, index) => (
                  <EventCard
                    key={index}
                    {...marathon}
                    onViewResults={() =>
                      router.push(`/events/${marathon.title.replace(/\s+/g, "-").toLowerCase()}`)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No se encontraron maratones con &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}