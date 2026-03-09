import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatQ } from '../data/servicios';
import { useCatalogos } from '../context/CatalogosContext';

export default function Servicios() {
  const { servicios: CATEGORIAS_SERVICIOS } = useCatalogos();
  const [abierta, setAbierta] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mt-0.5">Catálogo completo de servicios del taller</p>
        </div>
        <Link
          to="/nueva-solicitud"
          className="inline-flex items-center gap-2 bg-accent hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Solicitar servicio
        </Link>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {CATEGORIAS_SERVICIOS.map((cat) => {
          const isOpen = abierta === cat.categoria;
          return (
            <div
              key={cat.categoria}
              className={`bg-white rounded-xl border-2 ${cat.color} shadow-sm flex flex-col transition-all hover:shadow-md ${isOpen ? 'sm:col-span-2 xl:col-span-3' : ''}`}
            >
              {/* Cabecera de categoría */}
              <button
                onClick={() => setAbierta(isOpen ? null : cat.categoria)}
                className="w-full text-left p-6 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{cat.icon}</span>
                  <div className="flex items-center gap-2">
                    {cat.badge && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badgeColor}`}>
                        {cat.badge}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {cat.servicios.length}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-primary">{cat.categoria}</h3>
                  <p className="text-slate-500 text-sm mt-1">{cat.descripcion}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tiempo estimado: <span className="font-medium text-slate-700 ml-1">{cat.duracion}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Lista de servicios expandida */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-slate-50 px-6 pb-5 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Servicios disponibles ({cat.servicios.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {cat.servicios.map((serv, i) => (
                      <div
                        key={serv.nombre}
                        className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-lg border border-gray-200 text-sm"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 font-medium flex-1">{serv.nombre}</span>
                        <span className="text-accent font-bold text-xs whitespace-nowrap">{formatQ(serv.precio)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/nueva-solicitud"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-red-700 transition"
                    >
                      Solicitar servicio de {cat.categoria.toLowerCase()}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
