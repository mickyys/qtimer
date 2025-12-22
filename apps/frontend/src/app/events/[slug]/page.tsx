import Link from "next/link";

export default function EventPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[260px] bg-emerald-400/10 rotate-12 blur-2xl"></div>
      </div>

      <main className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center text-slate-300 hover:text-white transition group"
          >
            <span className="mr-2 text-lg transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Volver a eventos
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            1ra Fecha XCO Metropolitano 2025
          </h1>
          <p className="text-slate-300 mt-1 text-base sm:text-lg">
            Modalidad: <span className="font-semibold">CAD 3G</span>
          </p>

          {/* slug informativo */}
          <p className="mt-4 text-xs sm:text-sm text-slate-400">
            Evento:{" "}
            <span className="font-mono bg-slate-200/20 px-2 py-1 rounded text-slate-300">
              {params.slug}
            </span>
          </p>
        </header>

        {/* 🏆 PODIO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 🥈 Segundo */}
          <PodiumCard
            emoji="🥈"
            name="Nombre Corredor"
            category="Cadetes"
            time="00:42:10"
            pace="05:15 min/km"
            border="border-slate-300"
            order="order-2 md:order-1"
          />

          {/* 🥇 Primero */}
          <PodiumWinner />

          {/* 🥉 Tercero */}
          <PodiumCard
            emoji="🥉"
            name="Nombre Corredor"
            category="Cadetes"
            time="00:43:05"
            pace="05:25 min/km"
            border="border-amber-400"
            order="order-3"
          />
        </section>

        {/* 📋 TABLA RESULTADOS */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Resultados completos</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-500">
                    Pos
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-500">
                    Nombre
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-500">
                    Categoría
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-500">
                    Tiempo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-500">
                    Ritmo
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-emerald-50 font-semibold">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    1
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    Máximo Quililongo
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">Cadetes</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    00:40:32
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    00:00 min/km
                  </td>
                </tr>

                <ResultRow
                  pos={2}
                  name="Nombre Corredor"
                  category="Cadetes"
                  time="00:42:10"
                  pace="05:15 min/km"
                />

                <ResultRow
                  pos={3}
                  name="Nombre Corredor"
                  category="Cadetes"
                  time="00:43:05"
                  pace="05:25 min/km"
                />
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTES                               */
/* -------------------------------------------------------------------------- */

function PodiumCard({
  emoji,
  name,
  category,
  time,
  pace,
  border,
  order,
}: {
  emoji: string;
  name: string;
  category: string;
  time: string;
  pace: string;
  border: string;
  order?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 text-center border-t-4 ${border} ${order}`}
    >
      <p className="text-2xl">{emoji}</p>
      <h3 className="mt-2 font-semibold text-lg">{name}</h3>
      <p className="text-sm text-slate-500">{category}</p>
      <p className="mt-4 text-xl font-bold">{time}</p>
      <p className="text-sm text-slate-500">Ritmo {pace}</p>
    </div>
  );
}

function PodiumWinner() {
  return (
    <div className="bg-emerald-50 rounded-2xl shadow-lg p-8 text-center border-t-4 border-emerald-500 md:scale-105 order-1 md:order-2">
      <p className="text-3xl">🥇</p>
      <h3 className="mt-2 font-bold text-xl">Máximo Quililongo</h3>
      <p className="text-sm text-slate-600">Cadetes</p>
      <p className="mt-4 text-2xl font-bold">00:40:32</p>
      <p className="text-sm text-slate-600">Ritmo 00:00 min/km</p>
    </div>
  );
}

function ResultRow({
  pos,
  name,
  category,
  time,
  pace,
}: {
  pos: number;
  name: string;
  category: string;
  time: string;
  pace: string;
}) {
  return (
    <tr className="border-t hover:bg-slate-50">
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{pos}</td>
      <td className="px-4 sm:px-6 py-3 sm:py-4">{name}</td>
      <td className="px-4 sm:px-6 py-3 sm:py-4">{category}</td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{time}</td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{pace}</td>
    </tr>
  );
}
