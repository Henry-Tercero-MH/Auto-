import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seguimiento from './Seguimiento';
import logo from '../imagenes/logoMecanica.png';

/* ─── Modal de seguimiento ─── */
function SeguimientoModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header modal */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-white font-bold text-lg">Seguimiento de vehículo</p>
            <p className="text-white/60 text-sm">Consulta el estado de tu servicio en tiempo real</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido - usando el componente Seguimiento existente */}
        <div className="p-4">
          <Seguimiento />
        </div>
      </div>
    </div>
  );
}

/* ─── ErrorBox helper ─── */
function ErrorBox({ msg }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
  );
}

/* ─── Modal de login ─── */
function LoginModal({ onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('admin'); // 'admin' | 'mecanico'
  const [form, setForm] = useState({ email: '', password: '' });
  const [mecForm, setMecForm] = useState({ nombre: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const spinnerIcon = (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Ingresando...
    </span>
  );

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login({ email: form.email, password: form.password });
    if (result === true) { navigate('/'); }
    else if (result === 'horario') { setError('Acceso no permitido fuera del horario laboral'); setLoading(false); }
    else { setError('Correo o contraseña incorrectos'); setLoading(false); }
  };

  const handleSubmitMecanico = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login({ mecanicoNombre: mecForm.nombre, pin: mecForm.pin });
    if (result === true) { navigate('/solicitudes'); }
    else if (result === 'horario') { setError('Acceso no permitido fuera del horario laboral'); setLoading(false); }
    else { setError('Correo o PIN incorrecto'); setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header modal */}
        <div className="bg-primary px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow">
              <img src={logo} alt="AUTO+" className="h-9 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Panel de gestión</p>
              <p className="text-white/60 text-xs">Acceso para personal del taller</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab('admin'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'admin' ? 'text-accent border-b-2 border-accent' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Administrador
          </button>
          <button
            onClick={() => { setTab('mecanico'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'mecanico' ? 'text-accent border-b-2 border-accent' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mecánico
          </button>
        </div>

        <div className="px-6 py-6">

          {/* ── Admin ── */}
          {tab === 'admin' && (
            <form onSubmit={handleSubmitAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition bg-slate-50"
                  placeholder="admin@drivebot.com" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <input
                  type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition bg-slate-50"
                  placeholder="••••••••" required
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading}
                className="w-full bg-accent hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? spinnerIcon : 'Ingresar al sistema'}
              </button>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 space-y-0.5">
                <p className="font-semibold text-slate-500">Demo:</p>
                <p>Email: <span className="font-mono text-slate-600">admin@drivebot.com</span></p>
                <p>Contraseña: <span className="font-mono text-slate-600">admin123</span></p>
              </div>
            </form>
          )}

          {/* ── Mecánico ── */}
          {tab === 'mecanico' && (
            <form onSubmit={handleSubmitMecanico} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={mecForm.nombre}
                  onChange={(e) => setMecForm({ ...mecForm, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition bg-slate-50"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">PIN de acceso</label>
                <input
                  type="password" inputMode="numeric" maxLength={6}
                  value={mecForm.pin}
                  onChange={(e) => setMecForm({ ...mecForm, pin: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition bg-slate-50 tracking-widest text-center text-lg"
                  placeholder="••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading}
                className="w-full bg-accent hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? spinnerIcon : 'Ingresar como mecánico'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── Página principal / Landing ─── */
export default function Login() {
  const [modalOpen, setModalOpen] = useState(false);
  const [seguimientoModalOpen, setSeguimientoModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Navbar ── */}
      <header className="bg-primary shadow-lg sticky top-0 z-40">
        {/* Barra superior — overflow-hidden solo aquí para no cortar el dropdown */}
        <div className="relative overflow-hidden">
        {/* Panel blanco diagonal — solo visible al hacer scroll, máx 40% del ancho */}
        <div
          className="absolute inset-y-0 left-0 bg-white transition-opacity duration-500 pointer-events-none"
          style={{
            width: 'min(40%, 360px)',
            clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)',
            opacity: scrolled ? 1 : 0,
          }}
        />
        {/* Logo — absolutamente en la parte blanca del header */}
        <div className={`absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 transition-all duration-500 ${scrolled ? 'opacity-100 translate-y-[-50%]' : 'opacity-0 pointer-events-none'}`}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <img src={logo} alt="AUTO+" className="h-9 object-contain" />
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-end md:justify-start gap-4">
          {/* Spacer solo en desktop para compensar el logo absoluto */}
          <div className="hidden md:block w-12 flex-shrink-0" />

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm flex-1 justify-center">
            <button onClick={() => scrollTo('servicios')} className="text-white/70 hover:text-white transition font-medium">
              Servicios
            </button>
            <button onClick={() => setSeguimientoModalOpen(true)} className="text-white/70 hover:text-white transition font-medium">
              Seguimiento
            </button>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setSeguimientoModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              Mi vehículo
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-accent hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
            >
              Ingresar
            </button>
            {/* Hamburger móvil */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/70 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
        </div>{/* fin overflow-hidden */}

        {/* Menú móvil */}
        {menuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 px-4 py-3 space-y-2">
            <button onClick={() => scrollTo('servicios')} className="block w-full text-left text-white/80 hover:text-white py-2 text-sm font-medium">Servicios</button>
            <button onClick={() => { setSeguimientoModalOpen(true); setMenuOpen(false); }} className="block w-full text-left text-white/80 hover:text-white py-2 text-sm font-medium">Seguimiento de vehículo</button>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary via-[#1a2a6e] to-[#0d1a42] overflow-hidden">
        {/* Decorativos */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent opacity-10 rounded-full" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-accent opacity-10 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white opacity-5 rounded-full" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3">Taller Automotriz Profesional</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Tu vehículo en las<br />
              <span className="text-accent">mejores manos</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg mb-8 max-w-md mx-auto md:mx-0">
              Diagnóstico, reparación y mantenimiento con tecnología de vanguardia. Consulta el estado de tu vehículo en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button
                onClick={() => setSeguimientoModalOpen(true)}
                className="bg-accent hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                Consultar mi vehículo
              </button>
              <button
                onClick={() => scrollTo('servicios')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Ver servicios
              </button>
            </div>
          </div>

          {/* Logo grande */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 sm:w-60 sm:h-60 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <img src={logo} alt="AUTO+" className="w-36 sm:w-44 object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Servicios rápidos ── */}
      <section id="servicios" className="bg-white py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">Nuestros servicios</h2>
            <p className="text-slate-500 mt-2 text-sm">Atención especializada para tu vehículo</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">

            {/* Diagnóstico / Scaner */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Scaner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Scaner</p>
                <p className="text-xs text-slate-500 mt-1">Lectura de códigos de falla con equipo de última generación</p>
              </div>
            </div>

            {/* Servicio motor */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://plus.unsplash.com/premium_photo-1677009541707-c805a3ddf197?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Servicio motor"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Servicio motor</p>
                <p className="text-xs text-slate-500 mt-1">Mantenimiento y reparación integral del motor</p>
              </div>
            </div>

            {/* Servicio completo */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600377232142-164c095e686e?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Servicio completo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Servicio completo</p>
                <p className="text-xs text-slate-500 mt-1">Revisión general: aceite, filtros, bujías y más</p>
              </div>
            </div>

            {/* Servicio frenos */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://plus.unsplash.com/premium_photo-1664476481289-9a1571a1577c?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Servicio frenos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Servicio frenos</p>
                <p className="text-xs text-slate-500 mt-1">Pastillas, discos y líquido de frenos</p>
              </div>
            </div>

            {/* Ruido delantero */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bWVjYW5pY298ZW58MHx8MHx8fDA%3D"
                  alt="Ruido delantero"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Ruido delantero</p>
                <p className="text-xs text-slate-500 mt-1">Diagnóstico de ruidos y vibraciones en el eje delantero</p>
              </div>
            </div>

            {/* Ruido trasero */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Ruido trasero"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Ruido trasero</p>
                <p className="text-xs text-slate-500 mt-1">Diagnóstico de ruidos y vibraciones en el eje trasero</p>
              </div>
            </div>

            {/* Suspensión */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1599474151975-1f978922fa02?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Suspensión"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Suspensión</p>
                <p className="text-xs text-slate-500 mt-1">Amortiguadores, rótulas y brazos de control</p>
              </div>
            </div>

            {/* Más servicios */}
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-36 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1637640125496-31852f042a60?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Más servicios"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 bg-white">
                <p className="font-bold text-primary text-sm">Más servicios</p>
                <p className="text-xs text-slate-500 mt-1">Alineación, balanceo, cambio de aceite y más</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary mt-auto py-6 text-center">
        <p className="text-white/50 text-xs">© 2026 AUTO+ · Todos los derechos reservados, by Hemisterhe</p>
      </footer>

      {/* ── Modal login ── */}
      {modalOpen && <LoginModal onClose={() => setModalOpen(false)} />}
      
      {/* ── Modal seguimiento ── */}
      {seguimientoModalOpen && <SeguimientoModal onClose={() => setSeguimientoModalOpen(false)} />}
    </div>
  );
}
