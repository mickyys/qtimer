import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[260px] bg-emerald-400/10 rotate-12 blur-2xl"></div>
      </div>

      {/* Contenido */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-red-600">
            QUINTA<span className="text-white">TIMER</span>
          </h1>
          <p className="mt-2 text-slate-300 text-base sm:text-lg">
            Cronometraje deportivo · Resultados oficiales
          </p>
        </header>

        {/* Filtros */}
        <section className="mb-8 sm:mb-12">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Buscar por nombre */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar evento por nombre..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              {/* Select Región */}
              <div className="relative sm:w-60">
                <select
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 text-slate-800
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  <option value="">Todas las regiones</option>
                  <option>Región Metropolitana</option>
                  <option>Valparaíso</option>
                  <option>Biobío</option>
                  <option>La Araucanía</option>
                  <option>Los Lagos</option>
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Eventos */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 justify-items-center">
          {/* Evento */}
          <article className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-6 text-slate-800 max-w-md w-full">
            <span className="inline-flex items-center px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
              ⏱ Finalizado
            </span>

            <h2 className="text-lg sm:text-xl font-bold mb-1">
              1ra Fecha XCO Metropolitano
            </h2>

            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              🗓 Enero 2025 <br />
              📍 Región Metropolitana
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">XCO</span>
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">CAD 3G</span>
            </div>

            <Link href="/events/1"
               className="block text-center w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
              Ver resultados
            </Link>
          </article>

          {/* Evento */}
          <article className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-6 text-slate-800 max-w-md w-full">
            <span className="inline-flex items-center px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
              ⏱ Finalizado
            </span>

            <h2 className="text-lg sm:text-xl font-bold mb-1">
              2da Fecha XCO Metropolitano
            </h2>

            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              🗓 Febrero 2025 <br />
              📍 Valparaíso
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">XCO</span>
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">Juvenil</span>
            </div>

            <a href="#"
               className="block text-center w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
              Ver resultados
            </a>
          </article>

          {/* Evento */}
          <article className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-6 text-slate-800 max-w-md w-full">
            <span className="inline-flex items-center px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
              ⏱ Finalizado
            </span>

            <h2 className="text-lg sm:text-xl font-bold mb-1">
              3ra Fecha XCO Metropolitano
            </h2>

            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              🗓 Marzo 2025 <br />
              📍 Biobío
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">XCO</span>
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100">Open</span>
            </div>

            <a href="#"
               className="block text-center w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
              Ver resultados
            </a>
          </article>
        </section>

        {/* Footer */}
        <footer className="mt-14 sm:mt-20 text-center text-slate-400 text-xs sm:text-sm">
          © 2025 QTimer · Cronometraje deportivo profesional
        </footer>
      </main>
    </>
  );
}
