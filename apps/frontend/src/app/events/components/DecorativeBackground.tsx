export default function DecorativeBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[260px] bg-emerald-400/10 rotate-12 blur-2xl"></div>
    </div>
  );
}
