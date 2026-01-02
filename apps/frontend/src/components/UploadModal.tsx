"use client";

import { useState, useEffect } from "react";
import { uploadFile, uploadFileToEvent, getEvents } from "@/services/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedEventId?: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  fileHash?: string;
}

export default function UploadModal({ isOpen, onClose, onSuccess, preSelectedEventId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState({ message: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);
  
  // States for event selection
  const [uploadMode, setUploadMode] = useState<"new" | "existing">("new");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventsLoading, setEventsLoading] = useState(false);

  // Set initial upload mode and event based on props
  useEffect(() => {
    if (preSelectedEventId) {
      setUploadMode("existing");
      setSelectedEventId(preSelectedEventId);
    }
  }, [preSelectedEventId]);

  // Load events when modal opens and mode is existing
  useEffect(() => {
    if (isOpen && (uploadMode === "existing" || preSelectedEventId)) {
      loadEvents();
    }
  }, [isOpen, uploadMode, preSelectedEventId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFeedback({ message: "", isError: false });
      if (!preSelectedEventId) {
        setUploadMode("new");
        setSelectedEventId("");
      }
    }
  }, [isOpen, preSelectedEventId]);

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await getEvents("", "", 1, 100);
      setEvents(response.events.map(event => ({
        id: event.id,
        name: event.name,
        date: event.date,
        fileHash: event.fileHash
      })));
    } catch (error) {
      console.error("Error loading events:", error);
      setFeedback({ message: "Error al cargar los eventos", isError: true });
    } finally {
      setEventsLoading(false);
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

    if (uploadMode === "existing" && !selectedEventId) {
      setFeedback({ message: "Por favor, selecciona un evento", isError: true });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: "", isError: false });
    
    try {
      let result;
      if (uploadMode === "new") {
        result = await uploadFile(file);
      } else {
        result = await uploadFileToEvent(file, selectedEventId);
      }
      
      // Use the message from the backend, or construct a default one
      const feedbackMessage = result.message || 
        `Archivo subido con éxito! ID del Evento: ${result.EventID}. Registros insertados: ${result.RecordsInserted}.`;
      
      setFeedback({
        message: feedbackMessage,
        isError: false
      });
      setFile(null);
      
      // Call success callback to refresh parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000); // Show success message for 2 seconds before closing
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      setFeedback({ message: `Error al subir el archivo: ${errorMessage}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-6 text-white flex justify-between items-center">
          <h3 className="text-2xl font-bold">Subir Archivo de Resultados</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-6">
          {/* Upload Mode Selection - Hide if pre-selected event */}
          {!preSelectedEventId && (
            <div>
              <p className="text-slate-700 font-semibold mb-4">¿Qué deseas hacer?</p>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer p-3 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 transition">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="new"
                    checked={uploadMode === "new"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="w-4 h-4 accent-emerald-500"
                    disabled={isLoading}
                  />
                  <span className="text-slate-700 font-medium ml-3">Crear evento nuevo desde archivo</span>
                </label>
                <label className="flex items-center cursor-pointer p-3 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 transition">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="existing"
                    checked={uploadMode === "existing"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="w-4 h-4 accent-emerald-500"
                    disabled={isLoading}
                  />
                  <span className="text-slate-700 font-medium ml-3">Cargar datos a evento existente</span>
                </label>
              </div>
            </div>
          )}

          {/* Event Selection for existing mode */}
          {uploadMode === "existing" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Seleccionar Evento
              </label>
              {eventsLoading ? (
                <p className="text-slate-500 text-center py-4">Cargando eventos...</p>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-white text-slate-700 font-medium
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  disabled={isLoading}
                >
                  <option value="">Selecciona un evento...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.date).toLocaleDateString("es-ES")}
                      {event.fileHash ? " (Con datos)" : " (Sin datos)"}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* File Upload */}
          <div>
            <p className="text-slate-600 text-sm mb-4">
              {uploadMode === "new" 
                ? "El archivo creará un nuevo evento con el nombre especificado en la primera línea."
                : "El archivo reemplazará los datos del evento seleccionado."
              }
            </p>
            <div className="space-y-4">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".racecheck"
                className="block w-full text-sm text-slate-600
                  file:mr-4 file:py-3 file:px-5
                  file:rounded-xl file:border-0
                  file:text-sm file:font-bold
                  file:bg-gradient-to-r file:from-emerald-500 file:to-cyan-600
                  file:text-white file:cursor-pointer
                  hover:file:opacity-90 transition"
                disabled={isLoading}
              />
              {file && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <p className="text-sm text-emerald-700 font-medium">
                    📄 {file.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Message */}
          {feedback.message && (
            <div className={`p-4 rounded-xl flex gap-3 ${feedback.isError ? "bg-red-50 border-2 border-red-200" : "bg-green-50 border-2 border-green-200"}`}>
              <div className="text-lg">
                {feedback.isError ? "⚠️" : "✅"}
              </div>
              <p className={`text-sm font-medium ${feedback.isError ? "text-red-700" : "text-green-700"}`}>
                {feedback.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-slate-50 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFileUpload}
            disabled={!file || isLoading || (uploadMode === "existing" && !selectedEventId)}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold
               hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
          >
            {isLoading ? '⏳ Subiendo...' : '📤 Subir Archivo'}
          </button>
        </div>
      </div>
    </div>
  );
}