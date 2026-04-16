"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Edit, Trash2, FileUp, QrCode, Settings2, Calendar, MapPin, Clock } from "lucide-react";
import { getEvents, deleteEvent, updateEventStatus } from "@/services/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import UploadModal from "@/components/UploadModal";
import Logo from "@/components/Logo";
import QRModal from "./QRModal";

interface Event {
  id: string;
  name: string;
  slug: string;
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h3>
        <p className="text-gray-700 mb-6">
          ¿Estás seguro de que quieres eliminar el evento <strong>&quot;{eventName}&quot;</strong>? 
          Esta acción no se puede deshacer y se perderán todos los datos asociados.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
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
  }, [currentStatus, isOpen]);

  if (!isOpen) return null;

  const statuses = [
    { id: 'active', label: 'Activo', color: 'bg-green-100 text-green-800' },
    { id: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
    { id: 'finished', label: 'Finalizado', color: 'bg-blue-100 text-blue-800' },
    { id: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Cambiar Estado</h3>
        <p className="text-gray-700 mb-6">
          Actualiza el estado para <strong>&quot;{eventName}&quot;</strong>:
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedStatus === status.id
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${status.color}`}>
                {status.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selectedStatus)}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {isUpdating ? "Actualizando..." : "Guardar Cambios"}
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
  const [showPassword, setShowPassword] = useState(false);
  
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

  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    preSelectedEventId: string;
  }>({
    isOpen: false,
    preSelectedEventId: "",
  });

  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    eventName: string;
    eventSlug: string;
  }>({
    isOpen: false,
    eventName: "",
    eventSlug: "",
  });

  useEffect(() => {
    // Check if user was already authenticated in this session
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadEvents();
    }
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
        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
        loadEvents();
      } else {
        setAuthError("Contraseña incorrecta");
      }
    } catch (err) {
      setAuthError("Error de conexión");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getEvents("", "", 1, 100, true);
      setEvents(data.events);
      setError("");
    } catch (err) {
      setError("Error al cargar los eventos");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/edit-event/${id}`);
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
      setEvents(events.filter(e => e.id !== deleteModal.eventId));
      closeDeleteModal();
    } catch (err) {
      alert("Error al eliminar el evento");
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
      setEvents(events.map(e => e.id === statusModal.eventId ? { ...e, status: newStatus } : e));
      closeStatusModal();
    } catch (err) {
      alert("Error al actualizar el estado");
      setStatusModal(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const openUploadModal = (eventId: string = "") => {
    setUploadModal({
      isOpen: true,
      preSelectedEventId: eventId,
    });
  };

  const closeUploadModal = () => {
    setUploadModal({
      isOpen: false,
      preSelectedEventId: "",
    });
  };

  const handleUploadSuccess = () => {
    closeUploadModal();
    loadEvents();
  };

  const openQrModal = (eventName: string, eventSlug: string) => {
    setQrModal({
      isOpen: true,
      eventName,
      eventSlug,
    });
  };

  const closeQrModal = () => {
    setQrModal({
      ...qrModal,
      isOpen: false,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'finished': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'finished': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Acceso Administrador</h2>
            <p className="text-gray-600 mb-8 text-center">
            Ingresa tu contraseña de administrador para continuar
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    placeholder="Ingresa tu contraseña"
                    disabled={isAuthLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isAuthLoading}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="text-red-500 text-sm">{authError}</p>
              )}

              <button
                type="submit"
                disabled={isAuthLoading || !password}
                className="w-full px-6 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push("/events")}
                className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                ← Volver a eventos
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestión de Eventos</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Administra todos los eventos y resultados del sistema
            </p>
          </div>
          
          <button
            onClick={() => router.push("/admin/create-event")}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Crear Nuevo Evento
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="p-1.5 bg-red-100 rounded-full text-red-600">!</div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <LoadingOverlay />
            <p className="mt-4 text-gray-500 font-medium animate-pulse">Cargando eventos...</p>
          </div>
        )}

        {/* Content Section: Table for Desktop, Cards for Mobile */}
        {!isLoading && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Datos</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                        No se encontraron eventos registrados
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold group-hover:text-red-600 transition-colors">{event.name}</span>
                            <span className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                              <MapPin size={12} /> {event.address || "Sin dirección"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col text-sm">
                            <span className="text-gray-700 font-medium flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" /> {formatDate(event.date)}
                            </span>
                            <span className="text-gray-500 text-xs flex items-center gap-1.5 mt-1">
                              <Clock size={14} className="text-gray-400" /> {event.time || "--:--"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                            {getStatusLabel(event.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {event.fileHash ? (
                            <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                              Con datos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Sin datos
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => handleEdit(event.id)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar evento"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openUploadModal(event.id)}
                              className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Cargar resultados (.racecheck)"
                            >
                              <FileUp size={18} />
                            </button>
                            <button
                              onClick={() => openQrModal(event.name, event.slug)}
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Código QR"
                            >
                              <QrCode size={18} />
                            </button>
                            <button
                              onClick={() => openStatusModal(event.id, event.name, event.status)}
                              className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Cambiar estado"
                            >
                              <Settings2 size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(event.id, event.name)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar evento"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {events.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300">
                  <p className="text-gray-400">No hay eventos registrados</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1 truncate">
                          <MapPin size={14} /> {event.address || "Sin dirección"}
                        </p>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 py-2 border-y border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Fecha</span>
                        <span className="text-sm font-semibold text-gray-700">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Hora</span>
                        <span className="text-sm font-semibold text-gray-700">{event.time || "--:--"}</span>
                      </div>
                      <div className="flex flex-col ml-auto items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Resultados</span>
                        {event.fileHash ? (
                          <span className="text-xs font-bold text-green-600">✓ Cargados</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-500">⚠ Pendiente</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 pt-1">
                      <button
                        onClick={() => handleEdit(event.id)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-blue-50 text-blue-700 active:scale-90 transition-transform"
                      >
                        <Edit size={20} />
                        <span className="text-[10px] font-bold">Editar</span>
                      </button>
                      <button
                        onClick={() => openUploadModal(event.id)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-purple-50 text-purple-700 active:scale-90 transition-transform"
                      >
                        <FileUp size={20} />
                        <span className="text-[10px] font-bold">Archivo</span>
                      </button>
                      <button
                        onClick={() => openQrModal(event.name, event.slug)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-green-50 text-green-700 active:scale-90 transition-transform"
                      >
                        <QrCode size={20} />
                        <span className="text-[10px] font-bold">QR</span>
                      </button>
                      <button
                        onClick={() => openStatusModal(event.id, event.name, event.status)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-amber-50 text-amber-700 active:scale-90 transition-transform"
                      >
                        <Settings2 size={20} />
                        <span className="text-[10px] font-bold">Estado</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(event.id, event.name)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-red-50 text-red-700 active:scale-90 transition-transform"
                      >
                        <Trash2 size={20} />
                        <span className="text-[10px] font-bold">Borrar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
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

      <QRModal
        isOpen={qrModal.isOpen}
        onClose={closeQrModal}
        eventName={qrModal.eventName}
        eventSlug={qrModal.eventSlug}
      />
    </div>
  );
}
