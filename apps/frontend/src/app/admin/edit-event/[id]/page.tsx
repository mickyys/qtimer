"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEvent, updateEvent } from "@/services/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import ImageUpload from "@/components/ImageUpload";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  address: string;
  imageUrl: string;
  fileName?: string;
  fileExtension?: string;
  status: string;
  createdAt: string;
  fileHash?: string;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    imageUrl: "",
    fileName: "",
    fileExtension: "",
  });
  
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
          method: "GET",
          credentials: "include",
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          loadEvent();
        }
      } catch (error) {
        // Silently fail - require login
      }
    };

    checkAuth();
  }, [eventId]);

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
        loadEvent();
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

  const loadEvent = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    setError("");
    try {
      const event = await getEvent(eventId);
      setOriginalEvent(event);
      
      // Convert date from ISO to YYYY-MM-DD format
      const date = new Date(event.date);
      const formattedDate = date.toISOString().split('T')[0];
      
      setFormData({
        name: event.name || "",
        date: formattedDate || "",
        time: event.time || "",
        address: event.address || "",
        imageUrl: event.imageUrl || "",
        fileName: (event as any).fileName || "",
        fileExtension: (event as any).fileExtension || "",
      });
    } catch (err) {
      setError("Error al cargar el evento");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("El nombre del evento es obligatorio");
      }

      await updateEvent(eventId, formData);
      setSuccess("Evento actualizado exitosamente");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Evento</h1>
            <p className="text-gray-600 mb-8">
              Ingresa tu contraseña de administrador para continuar
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                  disabled={isAuthLoading}
                  autoFocus
                />
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header with Logo and Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">QT</span>
              </div>
              <div>
                <h1 className="text-gray-900 text-xl">
                  QuintaTimer Admin
                </h1>
                <p className="text-gray-600 text-sm">
                  Editar evento
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Editar Evento</h2>
          <p className="text-gray-600">
            {originalEvent && `Creado el ${formatDateForDisplay(originalEvent.createdAt)}`}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Nombre del Evento *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Ingrese el nombre del evento"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-2">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-900 mb-2">
                  Hora del Evento
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Ingrese la dirección del evento"
                disabled={isSubmitting}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Imagen del Evento
              </label>
              <ImageUpload 
                onImageUpload={handleImageUpload}
                eventId={eventId}
              />
            </div>

            {/* File Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fileName" className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre del Archivo
                </label>
                <input
                  type="text"
                  id="fileName"
                  name="fileName"
                  value={formData.fileName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="nombre-archivo.ext"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="fileExtension" className="block text-sm font-medium text-gray-900 mb-2">
                  Extensión del Archivo
                </label>
                <input
                  type="text"
                  id="fileExtension"
                  name="fileExtension"
                  value={formData.fileExtension}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder=".racecheck"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* File Status Info */}
            {originalEvent && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-900 font-medium mb-2">Información del Archivo</h3>
                <div className="text-gray-700 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Estado: </span>
                    {originalEvent.fileHash ? (
                      <span className="text-green-600">✓ Archivo cargado con datos</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Sin archivo de datos</span>
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Estado del evento: </span>
                    <span className={originalEvent.status === 'PUBLISHED' ? 'text-green-600' : 
                                   originalEvent.status === 'HIDDEN' ? 'text-yellow-600' : 'text-gray-600'}>
                      {originalEvent.status === 'PUBLISHED' ? 'Publicado' : 
                       originalEvent.status === 'HIDDEN' ? 'Oculto' : 'Borrador'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 justify-end pt-4">
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Actualizando..." : "Actualizar Evento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}