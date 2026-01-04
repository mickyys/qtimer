"use client";

import { useRouter } from "next/navigation";

export default function Logo() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/events")}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <div>
        <h1 className="text-xl font-black" style={{ fontFamily: "'Righteous', sans-serif", lineHeight: "1.2" }}>
          <span className="text-red-600">QUINTA</span><span className="text-gray-900">TIMER</span>
        </h1>
        <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em" }}>
          SPORT-TIMMING
        </p>
      </div>
    </button>
  );
}
