"use client";

import { useState } from "react";
import { uploadFile } from "@/services/api";

export default function UploadPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState({ message: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setFeedback({ message: "", isError: false });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        setFeedback({ message: data.message || "Contraseña incorrecta", isError: true });
      }
    } catch (error) {
      setFeedback({ message: "Error de conexión al intentar autenticar", isError: true });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setFeedback({ message: "Por favor, selecciona un archivo", isError: true });
      return;
    }
    setIsLoading(true);
    setFeedback({ message: "", isError: false });
    try {
      const result = await uploadFile(file);
      setFeedback({
        message: `Archivo subido con éxito! ID del Evento: ${result.EventID}. Registros insertados: ${result.RecordsInserted}. Reprocesado: ${result.Reprocessed ? 'Sí' : 'No'}.`,
        isError: false
      });
      setFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      setFeedback({ message: `Error al subir el archivo: ${errorMessage}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthenticatedContent = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Panel de Administración</h2>
          <p className="text-slate-400">
            Selecciona una opción para administrar los eventos
          </p>
        </div>
        <a
          href="/admin/create-event"
          className="px-6 py-2.5 rounded-lg bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition whitespace-nowrap"
        >
          + Crear Evento Manual
        </a>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Subir Archivo de Resultados</h3>
        <p className="text-slate-400 mb-4">
          Selecciona un archivo .racecheck para procesar los resultados de un evento.
        </p>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".racecheck"
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-500 file:text-white
              hover:file:bg-emerald-600 transition"
          />
          <button
            onClick={handleFileUpload}
            disabled={!file || isLoading}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-bold
               hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
        {feedback.message && (
          <p className={`mt-4 text-sm ${feedback.isError ? "text-red-400" : "text-green-400"}`}>
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );

  const renderPasswordForm = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Contraseña de Administrador
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white
             focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={authLoading}
        />
      </div>
      <button
        type="submit"
        className="px-5 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition disabled:bg-slate-700"
        disabled={authLoading}
      >
        {authLoading ? 'Verificando...' : 'Acceder'}
      </button>
      {feedback.message && feedback.isError && (
        <p className="mt-2 text-sm text-red-400">{feedback.message}</p>
      )}
    </form>
  );

  return (
    <>
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-[360px] h-[360px] bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 sm:p-10">
          {isAuthenticated ? renderAuthenticatedContent() : renderPasswordForm()}
        </div>
      </main>
    </>
  );
}
