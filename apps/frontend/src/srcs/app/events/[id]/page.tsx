"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/events/${params.id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
    const fetchResults = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/results/${params.id}`);
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };
    fetchEvent();
    fetchResults();
  }, [params.id]);


  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-emerald-400/10 rotate-12 blur-2xl"></div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {(event as any).name}
          </h1>
          <p className="text-slate-300 mt-1">
            Modalidad: <span className="font-semibold">CAD 3G</span>
          </p>
        </header>

        {/* 🏆 PODIO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 🥈 Segundo */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border-t-4 border-slate-300 text-slate-800">
            <p className="text-2xl">🥈</p>
            <h3 className="mt-2 font-semibold text-lg">Nombre Corredor</h3>
            <p className="text-sm text-slate-500">Cadetes</p>
            <p className="mt-4 text-xl font-bold">00:42:10</p>
            <p className="text-sm text-slate-500">Ritmo 05:15 min/km</p>
          </div>

          {/* 🥇 Primero */}
          <div className="bg-emerald-50 rounded-2xl shadow-lg p-8 text-center border-t-4 border-emerald-500 scale-105 text-slate-800">
            <p className="text-3xl">🥇</p>
            <h3 className="mt-2 font-bold text-xl">Máximo Quililongo</h3>
            <p className="text-sm text-slate-600">Cadetes</p>
            <p className="mt-4 text-2xl font-bold">00:40:32</p>
            <p className="text-sm text-slate-600">Ritmo 00:00 min/km</p>
          </div>

          {/* 🥉 Tercero */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border-t-4 border-amber-400 text-slate-800">
            <p className="text-2xl">🥉</p>
            <h3 className="mt-2 font-semibold text-lg">Nombre Corredor</h3>
            <p className="text-sm text-slate-500">Cadetes</p>
            <p className="mt-4 text-xl font-bold">00:43:05</p>
            <p className="text-sm text-slate-500">Ritmo 05:25 min/km</p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="mb-8">
            <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        🔍
                        </span>
                        <input
                        type="text"
                        placeholder="Buscar por NOMBRE|CHIP|DORSAL|MODALIDAD|CATEGORIA..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>
        </section>


        {/* 📋 TABLA RESULTADOS */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden text-slate-800">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Resultados completos</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500">Pos</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500">Nombre</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500">Categoría</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500">Tiempo</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-500">Ritmo</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result: any, index: number) => (
                    <tr key={result.id} className="border-t hover:bg-slate-50">
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4">{result.runner_name}</td>
                        <td className="px-6 py-4">{result.category}</td>
                        <td className="px-6 py-4">{result.time}</td>
                        <td className="px-6 py-4">{result.pace}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
