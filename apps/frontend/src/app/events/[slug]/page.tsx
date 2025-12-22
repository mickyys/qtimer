"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getParticipants } from "@/services/api";

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
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <Link href="/events" className="text-emerald-400 hover:text-emerald-300 transition mb-4 block">
            &larr; Volver a eventos
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Resultados del Evento
          </h1>
        </header>

        <section className="mb-8 bg-white/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FILTER_KEYS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={`Buscar por ${label.toLowerCase()}...`}
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="text-center text-white">Cargando participantes...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : participants.length === 0 ? (
          <div className="text-center text-white">No se encontraron participantes.</div>
        ) : (
          <div className="overflow-x-auto bg-white/95 backdrop-blur rounded-2xl shadow-xl">
            <table className="w-full text-sm text-left text-slate-800">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} scope="col" className="px-6 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    {tableHeaders.map((header) => (
                      <td key={header} className="px-6 py-4">{p.data[header] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold disabled:bg-slate-800 disabled:cursor-not-allowed hover:bg-slate-600 transition"
            >
              Anterior
            </button>
            <span className="text-white">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold disabled:bg-slate-800 disabled:cursor-not-allowed hover:bg-slate-600 transition"
            >
              Siguiente
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
