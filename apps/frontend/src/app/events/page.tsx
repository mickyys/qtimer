"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getEvents } from "@/services/api"; // Assuming @ is configured for src
import DatePicker from "@/components/DatePicker";
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';

interface Event {
  id: string;
  code: string;
  name: string;
  date: string;
  status: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { events: fetchedEvents, totalCount: fetchedTotalCount } =
        await getEvents(nameFilter, dateFilter ? dateFilter.format('YYYY-MM-DD') : "", currentPage, limit);
      setEvents(fetchedEvents);
      setTotalCount(fetchedTotalCount);
    } catch (err) {
      setError("No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [nameFilter, dateFilter, currentPage, limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEvents();
    }, 500); // Debounce API calls

    return () => {
      clearTimeout(handler);
    };
  }, [nameFilter, dateFilter, currentPage, fetchEvents]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[260px] bg-emerald-400/10 rotate-12 blur-2xl"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-red-600">
            QUINTA<span className="text-white">TIMER</span>
          </h1>
          <p className="mt-2 text-slate-300 text-base sm:text-lg">
            Cronometraje deportivo · Resultados oficiales
          </p>
        </header>

        <section className="mb-8 sm:mb-12 relative z-10">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative sm:basis-[70%]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar evento por nombre..."
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div className="relative sm:basis-[30%]">
                <DatePicker
                  value={dateFilter}
                  onChange={(newValue) => {
                    setDateFilter(newValue);
                    setCurrentPage(1);
                  }}
                  placeholder="Seleccionar fecha"
                />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center text-white">Cargando eventos...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-center text-white">No se encontraron eventos.</div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 justify-items-center">
            {events.map((event) => (
              <article key={event.id} className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-6 text-slate-800 max-w-md w-full flex flex-col h-full">
                <div className="flex-grow">
                  <span className="inline-flex items-center px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    ⏱ {event.status === 'PUBLISHED' ? 'Finalizado' : event.status}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold mb-1">{event.name}</h2>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    🗓 {new Date(event.date).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="block text-center w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition mt-auto"
                >
                  Ver resultados
                </Link>
              </article>
            ))}
          </section>
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
            <span className="text-white">
              Página {currentPage} de {totalPages}
            </span>
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
