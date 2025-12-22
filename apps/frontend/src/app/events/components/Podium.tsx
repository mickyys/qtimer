function PodiumCard({
  emoji,
  name,
  category,
  time,
  pace,
  border,
}: {
  emoji: string;
  name: string;
  category: string;
  time: string;
  pace: string;
  border: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 text-center border-t-4 ${border}`}
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
    <div className="bg-emerald-50 rounded-2xl shadow-lg p-8 text-center border-t-4 border-emerald-500 scale-105">
      <p className="text-3xl">🥇</p>
      <h3 className="mt-2 font-bold text-xl">Máximo Quililongo</h3>
      <p className="text-sm text-slate-600">Cadetes</p>
      <p className="mt-4 text-2xl font-bold">00:40:32</p>
      <p className="text-sm text-slate-600">Ritmo 00:00 min/km</p>
    </div>
  );
}

export default function Podium() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* 🥈 Segundo */}
      <PodiumCard
        emoji="🥈"
        name="Nombre Corredor"
        category="Cadetes"
        time="00:42:10"
        pace="05:15 min/km"
        border="border-slate-300"
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
      />
    </section>
  );
}
