import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../imagenes/logoMecanica.png';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-4">
        <div className="w-64 h-64 rounded-full bg-white flex flex-col items-center justify-center border-4 border-primary shadow-lg">
          <img
            src={logo}
            alt="Logo AUTO+ Mecánica General"
            className="w-56 h-44 object-contain mb-0"
          />
          {/* Nombre del usuario */}
        </div>
      </div>
      <h1 className="text-6xl font-black text-accent mb-6">404</h1>
      <p className="text-slate-500 mb-6 text-center">
        Ruta no encontrada.<br />
        Comuniquese con el desarrollador.<br />
        <a href="https://wa.me/50240705002" className="text-blue-600 underline">WhatsApp</a>
      </p>
      <Link to="/" className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow hover:bg-blue-700 transition">Ir al inicio</Link>
    </div>
  );
}