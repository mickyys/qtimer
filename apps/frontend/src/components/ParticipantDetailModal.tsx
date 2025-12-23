"use client";

import React from "react";

interface Participant {
    id: string;
    data: { [key: string]: string };
}

interface ParticipantDetailModalProps {
    participant: Participant | null;
    onClose: () => void;
}

export default function ParticipantDetailModal({ participant, onClose }: ParticipantDetailModalProps) {
    if (!participant) return null;

    const handleShareWhatsApp = () => {
        const url = window.location.href;
        const text = encodeURIComponent(`¡Mira mis resultados en QuintaTimer! 🏃\n\n${Object.entries(participant.data)
            .map(([key, value]) => `*${key}:* ${value}`)
            .join("\n")}\n\nVer resultados: ${url}`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const handleShareInstagram = () => {
        // Note: Direct instagram sharing via URL is limited. 
        // Usually people share a screenshot. We'll provide a message.
        alert("Para compartir en Instagram, te recomendamos tomar una captura de pantalla de este detalle.");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-6 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Detalle del Registro</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(participant.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{key}</span>
                                <span className="text-lg font-medium text-slate-800">{value || "-"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleShareWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.341-4.108 9.692-9.405 9.88zM20.947 3.037A11.83 11.83 0 0012.042 0C5.462 0 0.101 5.361 0.098 11.943c0 2.103.55 4.156 1.593 5.92L0 24l6.335-1.662a11.85 11.85 0 005.701 1.465h.005c6.579 0 11.94-5.361 11.943-11.942 0-3.19-1.242-6.189-3.486-8.435z" />
                        </svg>
                        WhatsApp
                    </button>
                    <button
                        onClick={handleShareInstagram}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.353 2.612 6.766 6.965 6.966 1.28.058 1.688.072 4.962.072s3.682-.014 4.961-.072c4.353-.2 6.765-2.612 6.965-6.965.059-1.28.073-1.689.073-4.963s-.014-3.682-.072-4.961C23.727 2.612 23.116.201 18.73.013 17.45.013 17.042 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4.01 4.01 0 110-8.02 4.01 4.01 0 010 8.02zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        Instagram
                    </button>
                </div>
            </div>
        </div>
    );
}
