import DecorativeBackground from "../components/DecorativeBackground";
import Podium from "../components/Podium";
import ResultsTable from "../components/ResultsTable";

export default function EventPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden">
      <DecorativeBackground />
      <main className="relative max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            1ra Fecha XCO Metropolitano 2025
          </h1>
          <p className="text-slate-300 mt-1">
            Modalidad: <span className="font-semibold">CAD 3G</span>
          </p>

          {/* slug informativo */}
          <p className="mt-2 text-sm text-slate-400">
            Evento:{" "}
            <span className="font-mono bg-slate-200/20 px-2 py-1 rounded text-slate-300">
              {params.slug}
            </span>
          </p>
        </header>

        {/* 🏆 PODIO */}
        <Podium />

        {/* 📋 TABLA RESULTADOS */}
        <ResultsTable />
      </main>
    </div>
  );
}
