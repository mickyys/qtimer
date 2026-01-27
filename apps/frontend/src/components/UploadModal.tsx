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
      const response = await getEvents("", "", 1, 100, true); // Include HIDDEN events in admin
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
      const feedbackMessage = result.Message || 
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Subir Archivo de Resultados</h3>
            <p className="text-gray-600 text-sm mt-1">
              {uploadMode === "new" 
                ? "Crea un nuevo evento desde un archivo"
                : "Carga datos a un evento existente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-8 space-y-6">
          {/* Upload Mode Selection - Hide if pre-selected event */}
          {!preSelectedEventId && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                ¿Qué deseas hacer?
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="new"
                    checked={uploadMode === "new"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="w-4 h-4"
                    disabled={isLoading}
                  />
                  <span className="text-gray-900 font-medium ml-3">Crear evento nuevo desde archivo</span>
                </label>
                <label className="flex items-center cursor-pointer p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="existing"
                    checked={uploadMode === "existing"}
                    onChange={(e) => setUploadMode(e.target.value as "new" | "existing")}
                    className="w-4 h-4"
                    disabled={isLoading}
                  />
                  <span className="text-gray-900 font-medium ml-3">Cargar datos a evento existente</span>
                </label>
              </div>
            </div>
          )}

          {/* Event Selection for existing mode */}
          {uploadMode === "existing" && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Seleccionar Evento
              </label>
              {eventsLoading ? (
                <p className="text-gray-500 text-center py-4">Cargando eventos...</p>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                  disabled={isLoading}
                >
                  <option value="">Selecciona un evento...</option>
                  {events.map((event) => {
                    // Parsear la fecha correctamente
                    const [year, month, day] = event.date.split('T')[0].split('-');
                    const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const formattedDate = eventDate.toLocaleDateString("es-ES");
                    return (
                      <option key={event.id} value={event.id}>
                        {event.name} - {formattedDate}
                        {event.fileHash ? " (Con datos)" : " (Sin datos)"}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Archivo de Resultados
            </label>
            <p className="text-gray-600 text-sm mb-4">
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
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-bold
                  file:bg-red-600
                  file:text-white file:cursor-pointer
                  hover:file:bg-red-700 transition"
                disabled={isLoading}
              />
              {file && (
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-900 font-medium">
                    📄 {file.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Message */}
          {feedback.message && (
            <div className={`p-4 rounded-lg border ${feedback.isError ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <p className={`text-sm font-medium ${feedback.isError ? "text-red-700" : "text-green-700"}`}>
                {feedback.isError ? "⚠️" : "✅"} {feedback.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-8 py-4 bg-gray-50 flex flex-col sm:flex-row gap-3 border-t border-gray-200 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFileUpload}
            disabled={!file || isLoading || (uploadMode === "existing" && !selectedEventId)}
            className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold
               disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '⏳ Subiendo...' : '📤 Subir Archivo'}
          </button>
        </div>
      </div>
    </div>
  );
}