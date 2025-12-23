"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getParticipants } from "@/services/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import ParticipantDetailModal from "@/components/ParticipantDetailModal";

interface Participant {
  id: string;
  data: { [key: string]: string };
}

type Filters = {
  name: string;
  chip: string;
  dorsal: string;
  category: string;
  sex: string;
  position: string;
};

const FILTER_KEYS: { key: keyof Filters; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "chip", label: "Chip" },
  { key: "dorsal", label: "Dorsal" },
  { key: "category", label: "Categoría" },
  { key: "sex", label: "Sexo" },
  { key: "position", label: "Posición" },
];

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.slug as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    name: "", chip: "", dorsal: "", category: "", sex: "", position: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const limit = 200;

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const { participants: fetchedParticipants, totalCount: fetchedTotalCount } =
        await getParticipants(eventId, filters, currentPage, limit);
      setParticipants(fetchedParticipants);
      setTotalCount(fetchedTotalCount);
    } catch (err) {
      setError("No se pudieron cargar los participantes. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [eventId, filters, currentPage, limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchParticipants();
    }, 500);

    return () => clearTimeout(handler);
  }, [filters, currentPage, fetchParticipants]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const tableHeaders = participants.length > 0 ? Object.keys(participants[0].data) : [];

  return (
    <>
      <div className="absolute inset-0 pointer-events-none -z-10 bg-slate-900">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen">
        <header className="mb-8 sm:mb-12">
          <Link href="/events" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors mb-6 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a eventos
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
                Resultados
              </h1>
              <p className="text-slate-400 text-lg font-medium">Evento: <span className="text-emerald-400">{eventId}</span></p>
            </div>
            {totalCount > 0 && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-slate-300 text-sm">Total registrados: </span>
                <span className="text-white font-bold">{totalCount}</span>
              </div>
            )}
          </div>
        </header>

        <section className="mb-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros de búsqueda
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {FILTER_KEYS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
                <input
                  type="text"
                  placeholder={`Buscar...`}
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/20 transition-all"
                />
              </div>
            ))}
          </div>
        </section>

        {loading && participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-lg font-medium animate-pulse">Cargando resultados...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl text-center">
            <p className="text-lg font-bold">{error}</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="bg-white/5 border border-white/10 text-slate-400 p-20 rounded-3xl text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-medium">No se encontraron participantes.</p>
            <button
              onClick={() => setFilters({ name: "", chip: "", dorsal: "", category: "", sex: "", position: "" })}
              className="mt-4 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Limpiar todos los filtros
            </button>
          </div>
        ) : (
          <div className="relative group">
            <div className="overflow-x-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
              <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-black">#</th>
                    {tableHeaders.map((header) => (
                      <th key={header} scope="col" className="px-6 py-4 font-black">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((p, index) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedParticipant(p)}
                      className={`
                        cursor-pointer transition-all duration-150
                        ${selectedParticipant?.id === p.id
                          ? "bg-emerald-50 hover:bg-emerald-100"
                          : "hover:bg-slate-50"}
                      `}
                    >
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      {tableHeaders.map((header) => (
                        <td key={header} className="px-6 py-4 font-medium">
                          {p.data[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex flex-wrap justify-center items-center gap-4 mt-12 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <div className="px-6 py-2 rounded-xl bg-white/10 text-white font-bold">
              Página {currentPage} <span className="text-emerald-400 mx-1">/</span> {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </main>

      {/* Overlays & Modals */}
      {loading && <LoadingOverlay />}

      <ParticipantDetailModal
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
      />
    </>
  );
}
