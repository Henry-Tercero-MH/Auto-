import React from 'react';

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-4xl font-black text-primary mb-4">Sin conexión</h1>
      <p className="text-lg text-slate-600 mb-2">No tienes conexión a internet.</p>
      <p className="text-slate-400 mb-6">Por favor verifica tu red o espera a que vuelva la conexión.</p>
      <span className="text-2xl">📡</span>
    </div>
  );
}