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
      
      setFeedback({
        message: `Archivo subido con éxito! ID del Evento: ${result.EventID}. Registros insertados: ${result.RecordsInserted}. Reprocesado: ${result.Reprocessed ? 'Sí' : 'No'}.`,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Subir Archivo de Resultados</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Upload Mode Selection - Hide if pre-selected event */}
          {!preSelectedEventId && (
            <div>
              <p className="text-slate-300 mb-3">¿Qué deseas hacer?</p>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="new"
                    checked={uploadMode === "new"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="mr-2 text-emerald-500"
                    disabled={isLoading}
                  />
                  <span className="text-white">Crear evento nuevo desde archivo</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="existing"
                    checked={uploadMode === "existing"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="mr-2 text-emerald-500"
                    disabled={isLoading}
                  />
                  <span className="text-white">Cargar datos a evento existente</span>
                </label>
              </div>
            </div>
          )}

          {/* Event Selection for existing mode */}
          {uploadMode === "existing" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Seleccionar Evento
              </label>
              {eventsLoading ? (
                <p className="text-slate-400">Cargando eventos...</p>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <p className="text-slate-400 mb-4">
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
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-500 file:text-white
                  hover:file:bg-emerald-600 transition"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Feedback Message */}
          {feedback.message && (
            <div className={`p-4 rounded-lg ${feedback.isError ? "bg-red-900/20 border border-red-500/30" : "bg-green-900/20 border border-green-500/30"}`}>
              <p className={`text-sm ${feedback.isError ? "text-red-400" : "text-green-400"}`}>
                {feedback.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-600">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!file || isLoading || (uploadMode === "existing" && !selectedEventId)}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-bold
                 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}