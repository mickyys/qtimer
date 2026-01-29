"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import ImageUpload from "@/components/ImageUpload";
import Logo from "@/components/Logo";

export default function CreateEventPage() {
  const router = useRouter();
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
    fileExtension: ".racecheck",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrl: string, publicId: string) => {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            date: formData.date || null,
            time: formData.time || null,
            address: formData.address || null,
            imageUrl: formData.imageUrl || null,
            fileName: formData.fileName || null,
            fileExtension: formData.fileExtension,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el evento");
      }

      const result = await response.json();
      setSuccess(`Evento creado exitosamente. ID: ${result.id}`);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Check if user is already authenticated via localStorage
    const checkAuth = () => {
      const savedAuth = localStorage.getItem("adminAuth");
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          const now = Date.now();
          // Check if token is still valid (24 hours = 86400000 ms)
          if (authData.timestamp && (now - authData.timestamp) < 86400000) {
            setIsAuthenticated(true);
          } else {
            // Token expired, remove it and redirect
            localStorage.removeItem("adminAuth");
            router.push("/admin/dashboard");
          }
        } catch (error) {
          localStorage.removeItem("adminAuth");
          router.push("/admin/dashboard");
        }
      } else {
        // Not authenticated, redirect to dashboard
        router.push("/admin/dashboard");
      }
    };

    checkAuth();
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");

    try {
      // Validate against ADMIN_PASSWORD from environment
      if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        // Save authentication to localStorage with timestamp (24 hours)
        const authData = {
          authenticated: true,
          timestamp: Date.now()
        };
        localStorage.setItem("adminAuth", JSON.stringify(authData));
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setAuthError("Contraseña incorrecta");
      }
    } catch (error) {
      setAuthError("Error al validar contraseña");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    // Clear localStorage
    localStorage.removeItem("adminAuth");
    // Redirect to home
    router.push("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Evento</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header with Logo and Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                ← Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Evento</h2>
          <p className="text-gray-600">
            Completa el formulario para crear un nuevo evento
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

        {/* Create Form */}
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
                <select
                  id="fileExtension"
                  name="fileExtension"
                  value={formData.fileExtension}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value=".racecheck">.racecheck</option>
                  <option value=".xlsx">.xlsx</option>
                </select>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-gray-900 font-medium mb-2">Información</h3>
              <div className="text-gray-700 text-sm space-y-1">
                <p>
                  <span className="font-medium">Solo el nombre del evento es obligatorio.</span>
                </p>
                <p>
                  Los demás campos son opcionales y se pueden completar posteriormente.
                </p>
                <p>
                  Una vez creado, el evento estará disponible para cargar archivos de datos.
                </p>
              </div>
            </div>

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
                {isSubmitting ? "Creando..." : "Crear Evento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
