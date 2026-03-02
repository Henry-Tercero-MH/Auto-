import { Link } from 'react-router-dom';

const servicios = [
  {
    title: 'Scaner',
    icon: (
      <img
        src="https://media.istockphoto.com/id/2201019036/photo/portrait-of-smiling-interracial-auto-mechanic-scrolling-on-tablet-at-mechanic-workshop.jpg?s=2048x2048&w=is&k=20&c=WceBVc53kkhYNWY0GepYxOveh9tzOL03eVxE2yxS6tA="
        alt="Scaner mecánico"
        className="rounded-lg object-cover w-20 h-20 shadow-md"
      />
    ),
    description: 'Lectura de códigos de falla con equipo de última generación.',
    duracion: '30 - 45 min',
    color: 'border-blue-200 hover:border-blue-400',
    badge: 'Popular',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    title: 'Servicio motor',
    icon: '🔧',
    description: 'Revisión y mantenimiento integral del motor: aceite, filtros, bujías y sistema de enfriamiento.',
    duracion: '1 - 2 hrs',
    color: 'border-orange-200 hover:border-orange-400',
    badge: null,
    badgeColor: '',
  },
  {
    title: 'Servicio completo',
    icon: '⚙️',
    description: 'Mantenimiento preventivo completo del vehículo. Incluye revisión de todos los sistemas.',
    duracion: '2 - 3 hrs',
    color: 'border-accent hover:border-red-700',
    badge: 'Recomendado',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    title: 'Servicio frenos',
    icon: '🛑',
    description: 'Revisión, ajuste y reemplazo de balatas, discos y líquido de frenos. Garantía de seguridad.',
    duracion: '1 - 2 hrs',
    color: 'border-red-200 hover:border-red-400',
    badge: 'Esencial',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    title: 'Ruido delantero',
    icon: '🔊',
    description: 'Diagnóstico y reparación de ruidos en la parte delantera: rodamientos, rótulas y dirección.',
    duracion: '1 - 3 hrs',
    color: 'border-yellow-200 hover:border-yellow-400',
    badge: null,
    badgeColor: '',
  },
  {
    title: 'Ruido trasero',
    icon: '🔈',
    description: 'Diagnóstico y reparación de ruidos en la parte trasera: amortiguadores, bujes y ejes.',
    duracion: '1 - 3 hrs',
    color: 'border-purple-200 hover:border-purple-400',
    badge: null,
    badgeColor: '',
  },
  {
    title: 'Suspensión',
    icon: '🚗',
    description: 'Revisión y reemplazo de amortiguadores, resortes, bujes y componentes de suspensión.',
    duracion: '2 - 4 hrs',
    color: 'border-green-200 hover:border-green-400',
    badge: null,
    badgeColor: '',
  },
];

export default function Servicios() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mt-0.5">Servicios disponibles en el taller</p>
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

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {servicios.map((s) => (
          <div
            key={s.title}
            className={`bg-white rounded-xl border-2 ${s.color} shadow-sm p-6 flex flex-col gap-3 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl">{s.icon}</span>
              {s.badge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badgeColor}`}>
                  {s.badge}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg text-primary">{s.title}</h3>
              <p className="text-slate-500 text-sm mt-1">{s.description}</p>
            </div>

            <div className="flex items-center gap-1 mt-auto pt-3 border-t border-gray-100 text-sm text-slate-500">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tiempo estimado: <span className="font-medium text-slate-700 ml-1">{s.duracion}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
