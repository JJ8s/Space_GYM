"use client";

import { Suspense } from 'react';
import AuthForm from '@/components/Auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
      
      {/* 1. ANIMACIÓN DE FONDO */}
      <div className="absolute inset-0 opacity-10">
        <div 
            className="absolute inset-0"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)',
                backgroundSize: '40px 40px',
                animation: 'slideBackground 20s linear infinite'
            }}
        />
      </div>

      <style jsx global>{`
        @keyframes slideBackground {
          from { background-position: 0 0; }
          to { background-position: 100% 100%; }
        }
      `}</style>

      {/* 2. ELEMENTOS DECORATIVOS (Círculos difusos) */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-black rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* 3. CARGA DEL COMPONENTE INTELIGENTE */}
      <Suspense fallback={<div className="font-bold text-red-600 animate-pulse">Cargando acceso...</div>}>
        <AuthForm />
      </Suspense>

    </div>
  );
}