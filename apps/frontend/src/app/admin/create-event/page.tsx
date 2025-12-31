"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateEventForm from "@/components/CreateEventForm";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function CreateEventPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check if user is already authenticated by verifying the auth cookie
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events`, {
          method: "GET",
          credentials: "include",
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Silently fail - require login
      }
    };

    checkAuth();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        const data = await response.json();
        setAuthError(data.message || "Contraseña incorrecta");
      }
    } catch (error) {
      setAuthError("Error de conexión al intentar autenticar");
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-2">Crear Evento</h1>
            <p className="text-slate-400 mb-8">
              Ingresa tu contraseña de administrador para continuar
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ingresa tu contraseña"
                  disabled={isAuthLoading}
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-red-400 text-sm">{authError}</p>
              )}

              <button
                type="submit"
                disabled={isAuthLoading || !password}
                className="w-full px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition"
              >
                {isAuthLoading ? "Verificando..." : "Continuar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Crear Nuevo Evento</h1>
          <p className="text-slate-400">
            Completa el formulario para crear un nuevo evento manualmente
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          <CreateEventForm onSuccess={() => {
            // After successful creation, redirect to events page
            router.push("/events");
          }} />
        </div>
      </div>
    </div>
  );
}
