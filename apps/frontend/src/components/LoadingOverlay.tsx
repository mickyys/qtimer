"use client";

import React from "react";

interface LoadingOverlayProps {
    message?: string;
}

export default function LoadingOverlay({ message = "QuintaTimer" }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-emerald-100">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">
                    {message}
                </span>
            </div>
        </div>
    );
}
