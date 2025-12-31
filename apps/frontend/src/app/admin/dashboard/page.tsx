"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvents, deleteEvent, updateEventStatus } from "@/services/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import UploadModal from "@/components/UploadModal";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
  fileName: string;
  fileExtension: string;
  status: string;
  createdAt: string;
  fileHash?: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
  isDeleting: boolean;
}

const DeleteModal = ({ isOpen, onClose, onConfirm, eventName, isDeleting }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
        <p className="text-slate-300 mb-6">
          ¿Estás seguro de que quieres eliminar el evento <strong>&quot;{eventName}&quot;</strong>? 
          Esta acción no se puede deshacer y se perderán todos los datos asociados.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => void;
  eventName: string;
  currentStatus: string;
  isUpdating: boolean;
}

const StatusModal = ({ isOpen, onClose, onConfirm, eventName, currentStatus, isUpdating }: StatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  if (!isOpen) return null;

  const statuses = [
    { value: "PUBLISHED", label: "Publicado", color: "text-green-400" },
    { value: "HIDDEN", label: "Oculto", color: "text-yellow-400" },
    { value: "DRAFT", label: "Borrador", color: "text-gray-400" }
  ];

  const handleConfirm = () => {
    if (selectedStatus !== currentStatus) {
      onConfirm(selectedStatus);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Cambiar Estado del Evento</h3>
        <p className="text-slate-300 mb-4">
          Evento: <strong>&quot;{eventName}&quot;</strong>
        </p>
        
        <div className="space-y-3 mb-6">
          {statuses.map((status) => (
            <label key={status.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={selectedStatus === status.value}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mr-3 text-emerald-500"
                disabled={isUpdating}
              />
              <span className={`font-medium ${status.color}`}>{status.label}</span>
            </label>
          ))}
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isUpdating ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Events data
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    eventId: "",
    eventName: "",
    isDeleting: false,
  });

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventName: string;
    currentStatus: string;
    isUpdating: boolean;
  }>({
    isOpen: false,
    eventId: "",
    eventName: "",
    currentStatus: "",
    isUpdating: false,
  });

  // Upload modal state
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    preSelectedEventId?: string;
  }>({
    isOpen: false,
    preSelectedEventId: undefined,
  });

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events`, {
          method: "GET",
          credentials: "include",
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          loadEvents();
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
        loadEvents();
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

  const loadEvents = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getEvents("", "", 1, 100); // Get first 100 events
      setEvents(response.events);
    } catch (err) {
      setError("Error al cargar los eventos");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (eventId: string) => {
    router.push(`/admin/edit-event/${eventId}`);
  };

  const openDeleteModal = (eventId: string, eventName: string) => {
    setDeleteModal({
      isOpen: true,
      eventId,
      eventName,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      eventId: "",
      eventName: "",
      isDeleting: false,
    });
  };

  const handleDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await deleteEvent(deleteModal.eventId);
      await loadEvents(); // Reload events after deletion
      closeDeleteModal();
    } catch (err) {
      setError("Error al eliminar el evento");
      console.error(err);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const openStatusModal = (eventId: string, eventName: string, currentStatus: string) => {
    setStatusModal({
      isOpen: true,
      eventId,
      eventName,
      currentStatus,
      isUpdating: false,
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      isOpen: false,
      eventId: "",
      eventName: "",
      currentStatus: "",
      isUpdating: false,
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusModal(prev => ({ ...prev, isUpdating: true }));
    try {
      await updateEventStatus(statusModal.eventId, newStatus);
      await loadEvents(); // Reload events after status update
      closeStatusModal();
    } catch (err) {
      setError("Error al actualizar el estado del evento");
      console.error(err);
      setStatusModal(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const openUploadModal = (eventId?: string) => {
    setUploadModal({
      isOpen: true,
      preSelectedEventId: eventId,
    });
  };

  const closeUploadModal = () => {
    setUploadModal({
      isOpen: false,
      preSelectedEventId: undefined,
    });
  };

  const handleUploadSuccess = () => {
    loadEvents(); // Reload events after successful upload
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "text-green-400 bg-green-900/20";
      case "HIDDEN": return "text-yellow-400 bg-yellow-900/20";
      case "DRAFT": return "text-gray-400 bg-gray-900/20";
      default: return "text-gray-400 bg-gray-900/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "Publicado";
      case "HIDDEN": return "Oculto";
      case "DRAFT": return "Borrador";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Administración</h1>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-slate-400">
              Gestiona todos los eventos creados en el sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/admin/create-event")}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition whitespace-nowrap"
            >
              + Crear Evento
            </button>           
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingOverlay />
          </div>
        )}

        {/* Events Table */}
        {!isLoading && (
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron eventos
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-700/50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium">{event.name}</div>
                            {event.address && (
                              <div className="text-slate-400 text-sm">{event.address}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          <div>{formatDate(event.date)}</div>
                          {event.time && (
                            <div className="text-slate-400 text-sm">{event.time}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                            {getStatusLabel(event.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {event.fileHash ? (
                            <span className="text-green-400 text-sm">✓ Con datos</span>
                          ) : (
                            <span className="text-yellow-400 text-sm">⚠ Sin datos</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(event.id)}
                              className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => openUploadModal(event.id)}
                              className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs hover:bg-purple-700 transition"
                              title="Cargar archivo .racecheck a este evento"
                            >
                              📁 Archivo
                            </button>
                            <button
                              onClick={() => openStatusModal(event.id, event.name, event.status)}
                              className="px-3 py-1 rounded-md bg-amber-600 text-white text-xs hover:bg-amber-700 transition"
                            >
                              Estado
                            </button>
                            <button
                              onClick={() => openDeleteModal(event.id, event.name)}
                              className="px-3 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 transition"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        eventName={deleteModal.eventName}
        isDeleting={deleteModal.isDeleting}
      />
      
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={closeStatusModal}
        onConfirm={handleStatusUpdate}
        eventName={statusModal.eventName}
        currentStatus={statusModal.currentStatus}
        isUpdating={statusModal.isUpdating}
      />
      
      <UploadModal
        isOpen={uploadModal.isOpen}
        onClose={closeUploadModal}
        onSuccess={handleUploadSuccess}
        preSelectedEventId={uploadModal.preSelectedEventId}
      />
    </div>
  );
}