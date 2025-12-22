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
      <td className="px-6 py-4">{pos}</td>
      <td className="px-6 py-4">{name}</td>
      <td className="px-6 py-4">{category}</td>
      <td className="px-6 py-4">{time}</td>
      <td className="px-6 py-4">{pace}</td>
    </tr>
  );
}

export default function ResultsTable() {
  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Resultados completos</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-500">
                Pos
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-500">
                Nombre
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-500">
                Categoría
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-500">
                Tiempo
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-500">
                Ritmo
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="bg-emerald-50 font-semibold">
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4">Máximo Quililongo</td>
              <td className="px-6 py-4">Cadetes</td>
              <td className="px-6 py-4">00:40:32</td>
              <td className="px-6 py-4">00:00 min/km</td>
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
  );
}
