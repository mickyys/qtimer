"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    address: "",
    imageUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      // Validate form data
      if (!formData.name.trim()) {
        toast.error("El nombre del evento es requerido");
        setIsLoading(false);
        return;
      }
      if (!formData.date) {
        toast.error("La fecha del evento es requerida");
        setIsLoading(false);
        return;
      }
      if (!formData.time) {
        toast.error("La hora del evento es requerida");
        setIsLoading(false);
        return;
      }
      if (!formData.address.trim()) {
        toast.error("La dirección del evento es requerida");
        setIsLoading(false);
        return;
      }
      if (!formData.imageUrl.trim()) {
        toast.error("La URL de la imagen es requerida");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/events/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            date: formData.date,
            time: formData.time,
            address: formData.address,
            imageUrl: formData.imageUrl,
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
          className="w-full bg-slate-700 text-white border-slate-600 placeholder:text-slate-400 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
            Fecha *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-slate-700 text-white border-slate-600 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-white mb-2">
            Hora *
          </label>
          <input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full bg-slate-700 text-white border-slate-600 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-white mb-2">
          Dirección del Evento *
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
          required
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-white mb-2">
          Imagen del Evento *
        </label>
        <ImageUpload
          onImageUpload={handleImageUpload}
          isLoading={isLoading}
          onError={(error) => {
            // Error ya manejado en el componente
          }}
        />
      </div>

      <div className="flex gap-4 pt-6">
        <Button
          type="submit"
          disabled={isLoading}
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
