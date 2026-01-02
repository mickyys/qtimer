"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";
import { validateSlugInput } from "@/utils/slugValidation";

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    imageUrl: "",
    fileName: "",
    fileExtension: ".racecheck",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate slug when name changes
    if (name === "name") {
      const validation = validateSlugInput(value);
      setNameError(validation.isValid ? "" : validation.message);
    }
  };

  const handleImageUpload = (imageUrl: string, publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: imageUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data - solo el nombre es obligatorio
      if (!formData.name.trim()) {
        toast.error("El nombre del evento es requerido");
        setIsLoading(false);
        return;
      }

      // Validate slug
      const validation = validateSlugInput(formData.name);
      if (!validation.isValid) {
        toast.error(validation.message);
        setIsLoading(false);
        return;
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
        const error = await response.json();
        throw new Error(error.error || "Error al crear el evento");
      }

      const result = await response.json();
      toast.success(`Evento creado exitosamente. ID: ${result.id}`);
      
      // Reset form
      setFormData({
        name: "",
        date: "",
        time: "",
        address: "",
        imageUrl: "",
        fileName: "",
        fileExtension: ".racecheck",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to events page
        router.push("/events");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Nombre del Evento *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Maratón Ciudad 2024"
          className={`w-full bg-slate-700 text-white border-slate-600 placeholder:text-slate-400 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 ${
            nameError ? "focus:ring-red-500 border-red-500" : "focus:ring-emerald-500"
          }`}
          disabled={isLoading}
          required
        />
        {nameError && (
          <p className="mt-1 text-sm text-red-400">{nameError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-slate-700 text-white border-slate-600 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-white mb-2">
            Hora
          </label>
          <input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full bg-slate-700 text-white border-slate-600 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-white mb-2">
          Dirección del Evento
        </label>
        <input
          id="address"
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          placeholder="Ej: Calle Principal 123, Ciudad"
          className="w-full bg-slate-700 text-white border-slate-600 placeholder:text-slate-400 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-white mb-2">
          Imagen del Evento
        </label>
        <ImageUpload
          onImageUpload={handleImageUpload}
          isLoading={isLoading}
          onError={(error) => {
            // Error ya manejado en el componente
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-white mb-2">
            Nombre del Archivo
          </label>
          <input
            id="fileName"
            name="fileName"
            type="text"
            value={formData.fileName}
            onChange={handleChange}
            placeholder="nombre-archivo"
            className="w-full bg-slate-700 text-white border-slate-600 placeholder:text-slate-400 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="fileExtension" className="block text-sm font-medium text-white mb-2">
            Tipo de Archivo
          </label>
          <select
            id="fileExtension"
            name="fileExtension"
            value={formData.fileExtension}
            onChange={handleChange}
            className="w-full bg-slate-700 text-white border-slate-600 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          >
            <option value=".racecheck">.racecheck</option>
            <option value=".xlsx">.xlsx</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button
          type="submit"
          disabled={isLoading || !!nameError}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700"
        >
          {isLoading ? "Creando..." : "Crear Evento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1 border-slate-600 text-white hover:bg-slate-700"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
