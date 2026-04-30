"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Share2, Copy, Check, Download } from "lucide-react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventSlug: string;
}

const QRModal = ({ isOpen, onClose, eventName, eventSlug }: QRModalProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  if (!isOpen) return null;

  // URL del evento (asegurar que sea la URL absoluta)
  const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}/events/${eventSlug}`
    : "";

  const handleCopyImage = async () => {
    try {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Error al copiar imagen:", err);
          // Fallback: intentar copiar la URL si falla la imagen
          await navigator.clipboard.writeText(eventUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, "image/png");
    } catch (err) {
      console.error("Error en handleCopyImage:", err);
    }
  };

  const handleShare = async () => {
    setShareError(null);
    if (navigator.share) {
      try {
        const canvas = canvasRef.current?.querySelector("canvas");
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `qr-${eventSlug}.png`, { type: "image/png" });

          try {
            await navigator.share({
              title: `Resultados - ${eventName}`,
              text: `Mira los resultados del evento ${eventName} aquí:`,
              url: eventUrl,
              files: [file],
            });
          } catch (err) {
            // Si falla compartir con archivos (algunos navegadores), intentar solo URL
            if ((err as Error).name !== 'AbortError') {
              await navigator.share({
                title: `Resultados - ${eventName}`,
                text: `Mira los resultados del evento ${eventName} aquí:`,
                url: eventUrl,
              });
            }
          }
        }, "image/png");
      } catch (err) {
        console.error("Error al compartir:", err);
        setShareError("No se pudo compartir el contenido.");
      }
    } else {
      setShareError("La función de compartir no está disponible en este navegador.");
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qr-${eventSlug}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 truncate pr-4">QR del Evento</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-2 text-center">
            <p className="text-gray-900 font-semibold">{eventName}</p>
            <p className="text-gray-500 text-xs truncate max-w-[250px]">{eventUrl}</p>
          </div>

          <div
            ref={canvasRef}
            className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm mb-8"
          >
            <QRCodeCanvas
              value={eventUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-600" />
                  <span className="text-green-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all active:scale-95"
            >
              <Share2 size={18} />
              <span>Compartir</span>
            </button>

            <button
              onClick={handleDownload}
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Descargar Imagen
            </button>
          </div>

          {shareError && (
            <p className="mt-4 text-xs text-red-500 text-center">{shareError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRModal;
