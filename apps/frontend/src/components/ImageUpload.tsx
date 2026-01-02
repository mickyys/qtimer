"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, publicId: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  onError,
  isLoading = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const dragOverRef = useRef(false);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > maxSize) {
      const error = "El archivo excede el límite de 10 MB";
      toast.error(error);
      onError?.(error);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      const error =
        "Tipo de archivo no permitido. Solo: JPG, PNG, WebP, GIF";
      toast.error(error);
      onError?.(error);
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    const loadingToast = toast.loading("Subiendo imagen...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir la imagen");
      }

      const data = await response.json();

      // Crear preview desde la URL de Cloudinary
      setPreview(data.url);
      setFileName(file.name);

      toast.dismiss(loadingToast);
      toast.success("Imagen subida exitosamente");

      // Llamar callback con la URL y publicId
      onImageUpload(data.url, data.publicId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al subir la imagen";
      toast.dismiss(loadingToast);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      uploadFile(file);
    },
    []
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setFileName(null);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            dragOverRef.current
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
          } ${uploading || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            disabled={uploading || isLoading}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-400" />

            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploading || isLoading
                  ? "Subiendo imagen..."
                  : "Arrastra una imagen aquí o haz clic"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WebP o GIF (máx. 10 MB)
              </p>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading || isLoading}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Seleccionar archivo
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
          <div className="relative w-full h-64">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ✓ Imagen subida correctamente
                </p>
              </div>

              <button
                onClick={handleRemoveImage}
                disabled={uploading || isLoading}
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Eliminar imagen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
